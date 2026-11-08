import { expect } from 'chai';
import { network } from '../setup/http';
import craft, { report, reportSmartDisenchant } from '../../src/structures/craft/craft';

const flush = () => new Promise((resolve) => { setImmediate(resolve); });
const dog = (extra = {}) => ({ status: 'success', dust: 40, card: JSON.stringify({ id: 5, name: 'Dog' }), ...extra });
const named = (id, name) => dog({ card: JSON.stringify({ id, name }) });
const EVENTS = ['crafted', 'disenchanted', 'smartDisenchanted', 'autoDisenchanted', 'rejected'];
const PAGE_GLOBALS = ['location', 'updateQuantity', 'updateQuantities', 'applyFilters', 'showPage', 'currentPage'];

function leavePage() {
  PAGE_GLOBALS.forEach((key) => delete globalThis[key]);
  document.body.innerHTML = '';
}

function openPage(log, pathname = '/Crafting') {
  globalThis.location = { pathname };
  globalThis.currentPage = 3;
  globalThis.updateQuantity = ({ id }, change) => log.push(['updateQuantity', id, change]);
  globalThis.updateQuantities = (id, shiny, quantity) => log.push(['updateQuantities', id, shiny, quantity]);
  globalThis.applyFilters = () => log.push(['applyFilters']);
  globalThis.showPage = (page) => log.push(['showPage', page]);
  document.body.innerHTML = '<span id="dust">100</span><span id="totalDisenchant">5</span><span id="nbDTFragments">0</span><button id="btnCraftDT"></button><div id="DTFragmentsDiv"></div>';
}

describe('craft object', () => {
  let requests;
  let seen;
  let originalAdapter;
  let i18n;
  const removers = [];

  const listen = (event, listener) => {
    craft.on(event, listener);
    removers.push(() => craft.off(event, listener));
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

  before(() => {
    originalAdapter = network.adapter;
    network.adapter = (config) => new Promise((resolve, reject) => {
      requests.push({ config, resolve, reject });
    });
  });

  after(() => {
    network.adapter = originalAdapter;
  });

  beforeEach(() => {
    requests = [];
    seen = [];
    globalThis.location = { pathname: '/Home' };
    i18n = globalThis.$.i18n;
    EVENTS.forEach((event) => listen(event, (...args) => seen.push([event, ...args])));
  });

  afterEach(() => {
    removers.splice(0).forEach((remove) => remove());
    leavePage();
    delete globalThis.translateFromServerJson;
    if (i18n === undefined) delete globalThis.$.i18n;
    else globalThis.$.i18n = i18n;
  });

  describe('craft()', () => {
    it('asks the server for the card and reports what came back', async () => {
      const pending = craft.craft(5, { shiny: true });
      await flush();
      expect(body(requests[0])).to.deep.equal({ action: 'craft', idCard: 5, isShiny: true });
      await answer(requests[0], { data: dog({ shiny: true }) });
      const result = await pending;
      expect(result).to.deep.equal({ id: 5, name: 'Dog', dust: 40, shiny: true });
      expect(seen).to.deep.equal([['crafted', result]]);
    });

    it('takes a card id given as a string and is not shiny unless asked', async () => {
      const pending = craft.craft('5');
      await flush();
      expect(body(requests[0])).to.deep.equal({ action: 'craft', idCard: 5, isShiny: false });
      await answer(requests[0], { data: dog() });
      expect((await pending).shiny).to.equal(false);
    });

    it('refuses a card id that is not a number without asking the server', async () => {
      const error = await craft.craft('dog').catch((e) => e);
      expect(error.message).to.equal('A card id is required');
      expect(requests).to.have.length(0);
      expect(seen).to.have.length(0);
    });

    it('uses the card name the page gives it', async () => {
      globalThis.$.i18n = (key) => `Translated ${key}`;
      const pending = craft.craft(5);
      await flush();
      await answer(requests[0], { data: dog() });
      expect((await pending).name).to.equal('Translated card-name-5');
    });
  });

  describe('disenchant()', () => {
    it('sends a disenchant and reports it as disenchanted', async () => {
      const pending = craft.disenchant(5);
      await flush();
      expect(body(requests[0]).action).to.equal('disenchant');
      await answer(requests[0], { data: dog() });
      const result = await pending;
      expect(seen).to.deep.equal([['disenchanted', result]]);
    });
  });

  describe('autoDisenchant()', () => {
    it('reports the cards that changed', async () => {
      const pending = craft.autoDisenchant();
      await flush();
      expect(body(requests[0])).to.deep.equal({ action: 'auto' });
      await answer(requests[0], {
        data: { status: 'success', dust: 90, cardsId: '[1]', cardsShiny: '[false]', cardsQuantity: '[3]' },
      });
      const result = await pending;
      expect(result).to.deep.equal({ dust: 90, cards: [{ id: 1, shiny: false, owned: 3 }] });
      expect(seen).to.deep.equal([['autoDisenchanted', result]]);
    });
  });

  describe('when the server says no', () => {
    it('rejects with the translated message and reports it once', async () => {
      globalThis.translateFromServerJson = (m) => `Translated ${m}`;
      const pending = craft.craft(5).catch((e) => e);
      await flush();
      await answer(requests[0], { data: { status: 'errorMaintenance', message: 'maintenance' } });
      const error = await pending;
      expect(error.message).to.equal('Translated maintenance');
      expect(seen).to.deep.equal([[
        'rejected',
        { action: 'craft', message: 'Translated maintenance', status: 'errorMaintenance' },
      ]]);
    });

    it('rejects when it is rate limited, without reporting anything', async () => {
      const pending = craft.craft(5).catch((e) => e);
      await flush();
      await answer(requests[0], { status: 429, headers: { 'retry-after': '3' } });
      const error = await pending;
      expect(error.message).to.equal('Rate limited');
      expect(error.retryAfter).to.equal(3);
      expect(seen).to.have.length(0);
    });

    it('has no retryAfter when the server did not say', async () => {
      const pending = craft.craft(5).catch((e) => e);
      await flush();
      await answer(requests[0], { status: 429 });
      expect((await pending).retryAfter).to.equal(undefined);
    });

    it('rejects when the answer is empty or the request fails', async () => {
      const empty = craft.craft(5).catch((e) => e);
      await flush();
      await answer(requests[0], { data: '' });
      expect((await empty).message).to.equal('Request failed');
      const failed = craft.craft(5).catch((e) => e);
      await flush();
      await answer(requests[1], { status: 500, data: '' });
      expect((await failed).message).to.equal('Request failed');
    });

    it('uses the requested card when a success has no card in it', async () => {
      const result = await (async () => {
        const pending = craft.craft(5);
        await flush();
        await answer(requests[0], { data: { status: 'success', dust: 4 } });
        return pending;
      })();
      expect(result).to.include({ id: 5, dust: 4 });
    });

    it('rejects when an auto success has no cards in it', async () => {
      const pending = craft.autoDisenchant().catch((e) => e);
      await flush();
      await answer(requests[0], { data: { status: 'success', dust: 4 } });
      expect((await pending).message).to.contain('Unexpected response');
      expect(seen).to.have.length(0);
    });
  });

  describe('calls in a row', () => {
    it('go one at a time, in order', async () => {
      const first = craft.craft(1);
      const second = craft.craft(2);
      await flush();
      expect(requests).to.have.length(1);
      await answer(requests[0], { data: named(1, 'A') });
      expect(requests).to.have.length(2);
      await answer(requests[1], { data: named(2, 'B') });
      expect((await first).id).to.equal(1);
      expect((await second).id).to.equal(2);
    });

    it('carry on after one is refused', async () => {
      const first = craft.craft(1).catch((e) => e);
      const second = craft.craft(2);
      await flush();
      await answer(requests[0], { data: { status: 'error', message: 'no' } });
      await first;
      await flush();
      await answer(requests[1], { data: dog() });
      expect((await second).id).to.equal(5);
    });
  });

  describe('the Crafting page', () => {
    it('is updated before listeners hear about it', async () => {
      const log = [];
      openPage(log);
      listen('crafted', () => log.push(['event']));
      const pending = craft.craft(5);
      await flush();
      await answer(requests[0], { data: dog() });
      await pending;
      expect(log).to.deep.equal([['updateQuantity', 5, 1], ['applyFilters'], ['showPage', 3], ['event']]);
    });

    it('takes a copy away for a disenchant', async () => {
      const log = [];
      openPage(log);
      const pending = craft.disenchant(5);
      await flush();
      await answer(requests[0], { data: dog() });
      await pending;
      expect(log[0]).to.deep.equal(['updateQuantity', 5, -1]);
    });

    it('updates every card an auto changed, and clears what was going to be disenchanted', async () => {
      const log = [];
      openPage(log);
      const pending = craft.autoDisenchant();
      await flush();
      await answer(requests[0], {
        data: { status: 'success', dust: 175, cardsId: '[1,2]', cardsShiny: '[false,true]', cardsQuantity: '[3,1]' },
      });
      await pending;
      expect(log.filter(([name]) => name === 'updateQuantities')).to.deep.equal([
        ['updateQuantities', 1, false, 3],
        ['updateQuantities', 2, true, 1],
      ]);
      expect(document.querySelector('#dust').textContent).to.equal('175');
      expect(document.querySelector('#totalDisenchant').textContent).to.equal('0');
    });

    it('still resolves and emits when the page update throws', async () => {
      const log = [];
      openPage(log);
      globalThis.updateQuantity = () => { throw new Error('no table'); };
      const heard = [];
      listen('crafted', (card) => heard.push(card.dust));
      const pending = craft.craft(5);
      await flush();
      await answer(requests[0], { data: dog() });
      const result = await pending;
      expect(result.dust).to.equal(40);
      expect(heard).to.deep.equal([40]);
    });

    it('is not updated for a refusal', async () => {
      const log = [];
      openPage(log);
      const pending = craft.craft(5).catch((e) => e);
      await flush();
      await answer(requests[0], { data: { status: 'error', message: 'no' } });
      await pending;
      expect(log).to.deep.equal([]);
    });

    it('is left alone on other pages', async () => {
      const log = [];
      openPage(log, '/Decks');
      const pending = craft.craft(5);
      await flush();
      await answer(requests[0], { data: dog() });
      await pending;
      expect(log).to.deep.equal([]);
    });
  });

  describe('events from the page', () => {
    it('reports a success the page made', () => {
      report('craft', true, dog(), { action: 'craft', isShiny: false });
      expect(seen).to.deep.equal([['crafted', { id: 5, name: 'Dog', dust: 40, shiny: false }]]);
    });

    it('reports a refusal the page ran into', () => {
      report('disenchant', false, { status: 'error', message: 'no' }, {});
      expect(seen).to.deep.equal([['rejected', { action: 'disenchant', message: 'no', status: 'error' }]]);
    });

    it('ignores actions it does not know', () => {
      report('buy', true, dog(), {});
      report(undefined, false, {}, {});
      expect(seen).to.have.length(0);
    });
  });

  describe('dust', () => {
    it('is what the last craft left you with, already when listeners hear about it', async () => {
      let heard;
      listen('crafted', () => { heard = craft.dust; });
      const pending = craft.craft(5);
      await flush();
      await answer(requests[0], { data: dog({ dust: 123 }) });
      await pending;
      expect(craft.dust).to.equal(123);
      expect(heard).to.equal(123);
    });

    it('follows a disenchant, an auto and what the page did', async () => {
      const disenchant = craft.disenchant(5);
      await flush();
      await answer(requests[0], { data: dog({ dust: 150 }) });
      await disenchant;
      expect(craft.dust).to.equal(150);
      const auto = craft.autoDisenchant();
      await flush();
      await answer(requests[1], {
        data: { status: 'success', dust: 175, cardsId: '[]', cardsShiny: '[]', cardsQuantity: '[]' },
      });
      await auto;
      expect(craft.dust).to.equal(175);
      report('craft', true, dog({ dust: 200 }), { action: 'craft' });
      expect(craft.dust).to.equal(200);
      reportSmartDisenchant({ cards: [], dust: 260, gained: 60, stopped: false });
      expect(craft.dust).to.equal(260);
    });

    it('keeps the last value when a refusal or a response without dust comes back', async () => {
      report('craft', true, dog({ dust: 300 }), {});
      report('craft', false, { status: 'error', message: 'no' }, {});
      report('craft', true, dog({ dust: undefined }), {});
      expect(craft.dust).to.equal(300);
    });

    it('is kept for the next page, for the user the session recorded', () => {
      sessionStorage.setItem('UserID', '7');
      try {
        report('craft', true, dog({ dust: 444 }), {});
        const stored = JSON.parse(sessionStorage.getItem('underscript.craft.dust'));
        expect(stored.user).to.equal('7');
        expect(stored.dust).to.equal(444);
        expect(stored.at).to.be.a('number');
      } finally {
        sessionStorage.removeItem('UserID');
        sessionStorage.removeItem('underscript.craft.dust');
      }
    });

    it('is not kept without a user', () => {
      sessionStorage.removeItem('UserID');
      sessionStorage.removeItem('underscript.craft.dust');
      report('craft', true, dog({ dust: 445 }), {});
      expect(sessionStorage.getItem('underscript.craft.dust')).to.equal(null);
    });

    it('is also on underscript.craft, which cannot be set', () => {
      report('craft', true, dog({ dust: 321 }), {});
      expect(globalThis.underscript.craft.dust).to.equal(321);
      expect(() => { globalThis.underscript.craft.dust = 1; }).to.throw();
      expect(globalThis.underscript.craft.dust).to.equal(321);
    });

    it('reads the Crafting page when it can tell, and falls back to what it knows', () => {
      report('craft', true, dog({ dust: 300 }), {});
      openPage([]);
      document.querySelector('#dust').textContent = '999';
      expect(craft.dust).to.equal(999);
      document.querySelector('#dust').textContent = '';
      expect(craft.dust).to.equal(300);
    });

    it('does not read dust from other pages', () => {
      report('craft', true, dog({ dust: 300 }), {});
      openPage([], '/Decks');
      document.querySelector('#dust').textContent = '999';
      expect(craft.dust).to.equal(300);
    });
  });

  describe('smartDisenchanted', () => {
    it('is reported as given', () => {
      const run = { cards: [{ id: 1, shiny: false, quantity: 2 }], dust: 10, gained: 4, stopped: false };
      reportSmartDisenchant(run);
      expect(seen).to.deep.equal([['smartDisenchanted', run]]);
    });
  });
});
