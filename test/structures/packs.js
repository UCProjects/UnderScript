import { expect } from 'chai';
import axios from 'axios';
import eventManager from '../../src/utils/eventManager';
import packs from '../../src/structures/packs/packs';
import { clearToasts } from '../setup/simpletoast';
import installClock from '../setup/clock';
import Item from '../../src/structures/constants/item';

const flush = () => new Promise((resolve) => { setImmediate(resolve); });
const realTimeout = setTimeout;
const EVENTS = ['bought', 'opened', 'rejected'];
const added = (type = 'pack') => ({ action: 'getPackAdded', type, golds: 100, ucp: 20 });
const cardsOf = (...cards) => ({ action: 'getCards', type: 'pack', cards: JSON.stringify(cards) });
const text = () => document.body.textContent;
const card = (id, extra = {}) => ({ id, name: `Card ${id}`, rarity: 'COMMON', shiny: false, ...extra });

describe('packs object', () => {
  let requests;
  let seen;
  let originalAdapter;
  let holder;
  const removers = [];

  const listen = (event, listener) => {
    packs.on(event, listener);
    removers.push(() => packs.off(event, listener));
  };
  const answer = async (request, { status = 200, data, headers = {} }) => {
    if (status >= 400) {
      request.reject(Object.assign(new Error(`Request failed ${status}`), { response: { status, headers, data } }));
    } else {
      request.resolve({ status, data, headers, config: request.config });
    }
    await flush();
  };
  const body = (request) => JSON.parse(request.config.data);
  const sent = async (amount) => {
    for (let i = 0; i < 100 && requests.length < amount; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { realTimeout(resolve, 20); });
    }
  };
  const waiting = () => requests.filter((request) => !request.answered);
  const respond = async (data) => {
    const [request] = waiting();
    request.answered = true;
    await answer(request, { data });
  };
  const settleAll = async (make) => {
    while (waiting().length) {
      // eslint-disable-next-line no-await-in-loop
      await respond(make());
    }
  };

  before(async () => {
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => new Promise((resolve, reject) => {
      requests.push({ config, resolve, reject });
    });
    eventManager.emit({ singleton: true }, 'Deck:Loaded', { collection: '[]' });
    await flush();
  });

  after(() => {
    axios.defaults.adapter = originalAdapter;
  });

  beforeEach(() => {
    requests = [];
    seen = [];
    EVENTS.forEach((event) => listen(event, (...args) => seen.push([event, ...args])));
  });

  afterEach(() => {
    removers.splice(0).forEach((remove) => remove());
    clearToasts();
    holder?.remove();
    holder = undefined;
  });

  describe('buy()', () => {
    it('buys with gold unless told otherwise', async () => {
      const pending = packs.buy(2);
      await flush();
      expect(requests.map(body)).to.deep.equal([{ action: 'addPack' }, { action: 'addPack' }]);
      await settleAll(() => added());
      const result = await pending;
      expect(result).to.deep.equal({ count: 2, requested: 2, type: '', gold: true, stopped: false });
      expect(seen).to.deep.equal([['bought', result]]);
    });

    it('asks for the action of the type and currency', async () => {
      const pending = packs.buy(1, { type: 'DR', gold: false });
      await flush();
      expect(body(requests[0])).to.deep.equal({ action: 'addDRPackUcp' });
      await settleAll(() => added('drPack'));
      expect(await pending).to.include({ count: 1, type: 'DR', gold: false });
    });

    it('does not send more than five requests at once', async () => {
      const pending = packs.buy(8);
      await flush();
      expect(waiting()).to.have.length(5);
      await respond(added());
      expect(waiting()).to.have.length(5);
      await settleAll(() => added());
      expect((await pending).count).to.equal(8);
      expect(requests).to.have.length(8);
    });

    it('rejects a count that is not a whole number of at least one', async () => {
      const failures = await Promise.all([0, -1, 1.5, '2', undefined].map((count) => packs.buy(count).then(() => null, (e) => e)));
      failures.forEach((error) => expect(error).to.be.instanceOf(Error));
      expect(requests).to.have.length(0);
    });

    it('rejects a pack type that cannot be bought', async () => {
      const error = await packs.buy(1, { type: 'Shiny' }).then(() => null, (e) => e);
      expect(error.message).to.equal('Unsupported Pack: Shiny');
    });

    it('stops at the first refusal and says why', async () => {
      const pending = packs.buy(10);
      await flush();
      await respond({ status: 1, message: 'Not enough gold' });
      await settleAll(() => added());
      const result = await pending;
      expect(result).to.deep.equal({
        count: 4,
        requested: 10,
        type: '',
        gold: true,
        stopped: false,
        error: 'Not enough gold',
      });
      expect(requests.length).to.be.at.most(5);
      expect(seen.map(([name]) => name)).to.deep.equal(['rejected', 'bought']);
      expect(seen[0][1]).to.deep.equal({ action: 'addPack', message: 'Not enough gold' });
    });

    it('retries a request that got no usable answer', async () => {
      const pending = packs.buy(1);
      await flush();
      await respond('');
      await flush();
      expect(requests).to.have.length(2);
      await respond(added());
      expect((await pending).count).to.equal(1);
    });

    it('waits when rate limited, then carries on', async () => {
      const pending = packs.buy(1);
      await flush();
      requests[0].answered = true;
      await answer(requests[0], { status: 429, headers: { 'retry-after': '0' } });
      await flush();
      await new Promise((resolve) => { setTimeout(resolve, 1100); });
      expect(requests).to.have.length(2);
      await respond(added());
      expect((await pending).count).to.equal(1);
    }).timeout(5000);

    it('only runs one purchase at a time', async () => {
      const pending = packs.buy(1);
      const error = await packs.buy(1).then(() => null, (e) => e);
      expect(error.message).to.equal('Packs are already being bought or opened');
      expect(packs.buying).to.equal(true);
      expect(packs.opening).to.equal(false);
      await flush();
      await settleAll(() => added());
      await pending;
      expect(packs.buying).to.equal(false);
    });

    it('stops buying when told to', async () => {
      const pending = packs.buy(10);
      await flush();
      await respond(added());
      document.querySelector('.simpletoast-button').click();
      await settleAll(() => added());
      const result = await pending;
      expect(result.stopped).to.equal(true);
      expect(result.count).to.equal(6);
      expect(requests).to.have.length(6);
    });

    it('shows the result unless a listener cancels it', async () => {
      let pending = packs.buy(1);
      await flush();
      await settleAll(() => added());
      await pending;
      expect(text()).to.include('Bought 1 Pack with Gold');
      clearToasts();

      listen('bought', function cancel() { this.canceled = true; });
      pending = packs.buy(1);
      await flush();
      await settleAll(() => added());
      await pending;
      expect(text()).to.not.include('Bought');
    });

    it('tells the page what happened', async () => {
      holder = document.createElement('div');
      document.body.append(holder);
      holder.innerHTML = '<span id="nbUTYPacks">3</span><span class="nbPacksHeader">10</span><span id="golds">500</span><span id="ucp">50</span>';
      const pending = packs.buy(1, { type: 'UTY' });
      await flush();
      await settleAll(() => added('utyPack'));
      await pending;
      expect(document.querySelector('#nbUTYPacks').textContent).to.equal('4');
      expect(document.querySelector('.nbPacksHeader').textContent).to.equal('11');
      expect(document.querySelector('#golds').textContent).to.equal('100');
      expect(document.querySelector('#ucp').textContent).to.equal('20');
    });
  });

  describe('open()', () => {
    it('opens packs and collects the cards, marking each card new the first time it shows up', async () => {
      const pending = packs.open(2);
      await sent(2);
      expect(requests.map(body)).to.deep.equal([{ action: 'openPack' }, { action: 'openPack' }]);
      await respond(cardsOf(card(9001), card(9002), card(9002, { shiny: true }), card(9001)));
      await respond(cardsOf(card(9002)));
      const result = await pending;
      expect(result.count).to.equal(2);
      expect(result.type).to.equal('');
      expect(result.cards.map(({ id, shiny, new: isNew }) => [id, shiny, isNew])).to.deep.equal([
        [9001, false, true],
        [9002, false, true],
        [9002, true, true],
        [9001, false, false],
        [9002, false, false],
      ]);
      expect(seen).to.deep.equal([['opened', result]]);
    });

    it('takes a pack type or its item', async () => {
      let pending = packs.open(1, 'Shiny');
      await sent(1);
      expect(body(requests[0])).to.deep.equal({ action: 'openShinyPack' });
      await settleAll(() => cardsOf(card(1)));
      expect((await pending).type).to.equal('Shiny');

      pending = packs.open(1, Item.DR_PACK);
      await sent(2);
      expect(body(requests[1])).to.deep.equal({ action: 'openDRPack' });
      await settleAll(() => cardsOf(card(1)));
      expect((await pending).type).to.equal('DR');
    });

    it('rejects an unsupported type', async () => {
      const error = await packs.open(1, 'Gold').then(() => null, (e) => e);
      expect(error.message).to.equal('Unsupported Pack: Gold');
      const itemError = await packs.open(1, Item.GOLD).then(() => null, (e) => e);
      expect(itemError.message).to.equal('Unsupported Item: Gold');
    });

    it('reports a refusal', async () => {
      const pending = packs.open(1);
      await sent(1);
      await respond({ action: 'getError', message: 'No packs' });
      const result = await pending;
      expect(result).to.include({ count: 0, error: 'No packs' });
      expect(result.cards).to.deep.equal([]);
    });

    it('shows the result unless a listener cancels it', async () => {
      let pending = packs.open(1);
      await sent(1);
      await settleAll(() => cardsOf(card(1)));
      await pending;
      expect(text()).to.include('Results: 1 Packs');
      clearToasts();

      listen('opened', function cancel() { this.canceled = true; });
      pending = packs.open(1);
      await sent(2);
      await settleAll(() => cardsOf(card(1)));
      await pending;
      expect(text()).to.not.include('Results');
    });
  });

  describe('late answers', () => {
    let clock;

    beforeEach(() => {
      clock = installClock(5000000);
    });

    afterEach(() => {
      clock.restore();
    });

    it('reports a pack that answers after the run gave up on it', async () => {
      const pending = packs.open(2);
      await sent(2);
      expect(requests).to.have.length(2);
      await respond(cardsOf(card(7001)));
      document.querySelector('.simpletoast-button').click();
      clock.tick(6000);
      const result = await pending;
      expect(result).to.include({ count: 1, stopped: true, late: false });

      await respond(cardsOf(card(7002), card(7003)));
      expect(seen.filter(([name]) => name === 'opened')).to.have.length(1);
      clock.tick(500);
      const [, late] = seen.filter(([name]) => name === 'opened')[1];
      expect(late).to.include({ count: 1, requested: 1, stopped: false, late: true });
      expect(late.cards.map(({ id }) => id)).to.deep.equal([7002, 7003]);
    });

    it('puts answers that arrive together into one result', async () => {
      const pending = packs.open(3);
      await sent(3);
      document.querySelector('.simpletoast-button').click();
      clock.tick(6000);
      await pending;
      await respond(cardsOf(card(7101)));
      await respond(cardsOf(card(7102)));
      await respond(cardsOf(card(7103)));
      clock.tick(500);
      const lates = seen.filter(([name, result]) => name === 'opened' && result.late);
      expect(lates).to.have.length(1);
      expect(lates[0][1].count).to.equal(3);
    });
  });

  describe('progress', () => {
    it('shows what is being bought and the currency while it runs', async () => {
      const pending = packs.buy(2, { gold: false });
      await flush();
      expect(text()).to.include('Buying 2 Packs with UCP');
      expect(document.querySelector('.simpletoast-button').textContent).to.equal('Stop');
      await settleAll(() => added());
      await pending;
    });

    it('shows what is being opened', async () => {
      const pending = packs.open(1, 'DR');
      await sent(1);
      expect(text()).to.include('Opening 1 DR Pack');
      await settleAll(() => cardsOf(card(1)));
      await pending;
    });
  });
});
