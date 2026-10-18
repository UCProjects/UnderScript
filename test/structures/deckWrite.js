import { expect } from 'chai';
import axios from 'axios';
import decks from '../../src/structures/deck/decks';
import { plan } from '../../src/structures/deck/write';

const card = (id, shiny = false) => ({ id, shiny });

describe('deck plan', () => {
  const now = (cards, artifacts = []) => ({ cards, artifacts });

  it('has nothing to do when the deck already matches', () => {
    const target = { cards: [card(2, true), card(1)], artifacts: [3] };
    expect(plan(now([card(1), card(2, true)], [3]), target)).to.deep.equal([]);
  });

  it('removes what is extra and adds what is missing', () => {
    const steps = plan(now([card(1), card(2), card(3)]), { cards: [card(1), card(3), card(4)] });
    expect(steps).to.deep.equal([
      { action: 'removeCard', id: 2, shiny: false },
      { action: 'addCard', id: 4, shiny: false },
    ]);
  });

  it('counts copies', () => {
    const steps = plan(now([card(1), card(1), card(1), card(2)]), { cards: [card(1), card(1), card(2), card(2)] });
    expect(steps).to.deep.equal([
      { action: 'removeCard', id: 1, shiny: false },
      { action: 'addCard', id: 2, shiny: false },
    ]);
  });

  it('keeps shiny and normal copies apart', () => {
    const steps = plan(now([card(1)]), { cards: [card(1), card(1, true)] });
    expect(steps).to.deep.equal([{ action: 'addCard', id: 1, shiny: true }]);
  });

  it('clears the deck and starts over when every card goes', () => {
    const steps = plan(now([card(1), card(2)], [5]), { cards: [card(3)], artifacts: [6] });
    expect(steps).to.deep.equal([
      { action: 'clear' },
      { action: 'addCard', id: 3, shiny: false },
      { action: 'addArtifact', id: 6 },
    ]);
  });

  it('clears the deck and starts over when too many cards go', () => {
    const cards = Array.from({ length: 20 }, (_, i) => card(i + 1));
    const target = [...cards.slice(0, 5), card(99)];
    const steps = plan(now(cards), { cards: target });
    expect(steps[0]).to.deep.equal({ action: 'clear' });
    expect(steps.length).to.equal(1 + target.length);
  });

  it('does not clear a deck that is already empty', () => {
    expect(plan(now([]), { cards: [card(1)] })).to.deep.equal([{ action: 'addCard', id: 1, shiny: false }]);
  });

  it('adds only the artifacts that are missing', () => {
    const steps = plan(now([card(1)], [2]), { cards: [card(1)], artifacts: [2, 4] });
    expect(steps).to.deep.equal([{ action: 'addArtifact', id: 4 }]);
  });

  it('clears the artifacts and adds them again when one is not wanted', () => {
    const steps = plan(now([card(1)], [2, 3]), { cards: [card(1)], artifacts: [3] });
    expect(steps).to.deep.equal([{ action: 'clearArtifacts' }, { action: 'addArtifact', id: 3 }]);
  });

  it('clears the artifacts when none are wanted', () => {
    expect(plan(now([card(1)], [2]), { cards: [card(1)] })).to.deep.equal([{ action: 'clearArtifacts' }]);
  });
});

describe('deck writes', () => {
  let originalAdapter;
  let requests;
  let respond;
  let server;

  const reply = (config, data, status = 200) => {
    const response = { data, status, statusText: '', headers: {}, config };
    if (status < 400) return Promise.resolve(response);
    return Promise.reject(Object.assign(new Error(`status ${status}`), { response }));
  };

  const current = (cards = [], artifacts = []) => ({
    decks: JSON.stringify([
      { soul: { name: 'KINDNESS' }, cardsList: cards, artifacts: artifacts.map((id) => ({ id })) },
    ]),
  });

  const accepted = {
    addCard: (body) => ({ status: 'success', soul: body.soul, card: JSON.stringify({ id: body.idCard, shiny: body.isShiny }) }),
    removeCard: (body) => ({ soul: body.soul, card: JSON.stringify({ id: body.idCard, shiny: body.isShiny }) }),
    removeAllCards: (body) => ({
      soul: body.soul,
      cardsId: '[]',
      cardsShiny: '[]',
      cardsQuantity: '[]',
    }),
    addArtifact: (body) => ({ action: 'getArtifactAdded', soul: body.soul, artifact: JSON.stringify({ id: body.idArtifact }) }),
    clearArtifacts: (body) => ({ action: 'getArtifactsCleared', soul: body.soul }),
  };

  beforeEach(() => {
    requests = [];
    server = current();
    respond = (body) => accepted[body.action](body);
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => {
      if (config.method === 'get') return reply(config, server);
      const body = JSON.parse(config.data);
      requests.push(body);
      return reply(config, respond(body));
    };
    globalThis.location = { pathname: '/' };
  });

  afterEach(() => {
    axios.defaults.adapter = originalAdapter;
    delete globalThis.location;
    delete globalThis.translateFromServerJson;
  });

  describe('single changes', () => {
    it('adds a card and says what changed', async () => {
      const seen = [];
      const listener = (change) => seen.push(change);
      decks.on('changed', listener);
      const edit = await decks.addCard('KINDNESS', 5, { shiny: true });
      decks.off('changed', listener);
      expect(requests).to.deep.equal([{ action: 'addCard', idCard: 5, isShiny: true, soul: 'KINDNESS' }]);
      expect(edit).to.deep.equal({ soul: 'KINDNESS', action: 'addCard', id: 5, shiny: true });
      expect(seen).to.deep.equal([edit]);
    });

    it('removes a card, adds and clears artifacts, and clears the deck', async () => {
      await decks.removeCard('KINDNESS', '7');
      await decks.addArtifact('KINDNESS', 3);
      await decks.clearArtifacts('KINDNESS');
      await decks.clear('KINDNESS');
      expect(requests).to.deep.equal([
        { action: 'removeCard', idCard: 7, isShiny: false, soul: 'KINDNESS' },
        { action: 'addArtifact', idArtifact: 3, soul: 'KINDNESS' },
        { action: 'clearArtifacts', soul: 'KINDNESS' },
        { action: 'removeAllCards', soul: 'KINDNESS' },
      ]);
    });

    it('rejects with what the server said, translated, and announces nothing', async () => {
      globalThis.translateFromServerJson = (message) => `translated ${message}`;
      respond = () => ({ status: 'error', message: 'deck-full' });
      const seen = [];
      const listener = (change) => seen.push(change);
      decks.on('changed', listener);
      let error;
      try {
        await decks.addCard('KINDNESS', 5);
      } catch (e) {
        error = e;
      }
      decks.off('changed', listener);
      expect(error.message).to.equal('translated deck-full');
      expect(seen).to.deep.equal([]);
    });

    it('treats a reply of the wrong kind as a refusal', async () => {
      respond = () => ({ action: 'somethingElse' });
      let error;
      try {
        await decks.addArtifact('KINDNESS', 1);
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('The server refused the change');
    });

    it('rejects with its own message when the server sends an empty reply', async () => {
      axios.defaults.adapter = (config) => reply(config, '');
      let error;
      try {
        await decks.addCard('KINDNESS', 5);
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('The server sent an empty reply');
    });

    it('rejects when the request fails, and when it is rate limited', async () => {
      axios.defaults.adapter = (config) => reply(config, '', 500);
      let error;
      try {
        await decks.clear('KINDNESS');
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('Request failed');
      axios.defaults.adapter = (config) => reply(config, '', 429);
      try {
        await decks.clear('KINDNESS');
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('Rate limited');
    });

    it('asks for a soul and an id before sending anything', async () => {
      const failures = await Promise.all([
        decks.addCard('', 5).catch((e) => e.message),
        decks.addCard('KINDNESS', 'x').catch((e) => e.message),
        decks.addCard('KINDNESS', undefined).catch((e) => e.message),
        decks.addArtifact('KINDNESS', null).catch((e) => e.message),
      ]);
      expect(failures).to.deep.equal([
        'A soul is required',
        'A card id is required',
        'A card id is required',
        'An artifact id is required',
      ]);
      expect(requests).to.deep.equal([]);
    });

    it('sends the changes one at a time, in order', async () => {
      const releases = [];
      axios.defaults.adapter = (config) => {
        const body = JSON.parse(config.data);
        requests.push(body);
        return new Promise((resolve) => {
          releases.push(() => resolve({ data: accepted[body.action](body), status: 200, statusText: '', headers: {}, config }));
        });
      };
      const first = decks.addCard('KINDNESS', 1);
      const second = decks.addCard('KINDNESS', 2);
      await new Promise((resolve) => { setTimeout(resolve, 5); });
      expect(requests.length).to.equal(1);
      releases[0]();
      await first;
      await new Promise((resolve) => { setTimeout(resolve, 5); });
      expect(requests.length).to.equal(2);
      releases[1]();
      await second;
      expect(requests.map(({ idCard }) => idCard)).to.deep.equal([1, 2]);
    });
  });

  describe('load', () => {
    it('changes the deck to match, one request at a time', async () => {
      server = current([card(1), card(2)], [3]);
      const edits = await decks.load('KINDNESS', { cards: [card(1), card(4, true)], artifacts: [3] });
      expect(requests).to.deep.equal([
        { action: 'removeCard', idCard: 2, isShiny: false, soul: 'KINDNESS' },
        { action: 'addCard', idCard: 4, isShiny: true, soul: 'KINDNESS' },
      ]);
      expect(edits.map(({ action }) => action)).to.deep.equal(['removeCard', 'addCard']);
    });

    it('sends nothing when the deck already matches', async () => {
      server = current([card(1)], [3]);
      expect(await decks.load('KINDNESS', { cards: [card(1)], artifacts: [3] })).to.deep.equal([]);
      expect(requests).to.deep.equal([]);
    });

    it('stops at the first change the server refuses', async () => {
      server = current([], []);
      respond = (body) => (body.idCard === 2 ? { status: 'error', message: 'nope' } : accepted[body.action](body));
      let error;
      try {
        await decks.load('KINDNESS', { cards: [card(1), card(2), card(3)] });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('nope');
      expect(requests.map(({ idCard }) => idCard)).to.deep.equal([1, 2]);
    });

    it('refuses a deck that is too big before changing anything', async () => {
      const cards = Array.from({ length: 26 }, (_, i) => card(i + 1));
      const failures = await Promise.all([
        decks.load('KINDNESS', { cards }).catch((e) => e.message),
        decks.load('KINDNESS', { cards: [], artifacts: [1, 2, 3] }).catch((e) => e.message),
        decks.load('KINDNESS', { cards: [card('x')] }).catch((e) => e.message),
        decks.load('KINDNESS', undefined).catch((e) => e.message),
        decks.load('', { cards: [] }).catch((e) => e.message),
      ]);
      expect(failures.every((message) => typeof message === 'string')).to.equal(true);
      expect(failures[0]).to.include('25');
      expect(failures[1]).to.include('2');
      expect(requests).to.deep.equal([]);
    });

    it('rejects for a soul the server does not have', async () => {
      let error;
      try {
        await decks.load('BRAVERY', { cards: [] });
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('Unknown soul: BRAVERY');
    });
  });

  describe('save', () => {
    beforeEach(() => {
      globalThis.selfId = 7;
    });

    afterEach(() => {
      delete globalThis.selfId;
    });

    it('stores the current deck in a slot', async () => {
      server = current([card(1), card(2, true)], [3]);
      const saved = await decks.save('KINDNESS', 4);
      expect(saved.cards).to.deep.equal([{ id: 1, shiny: false }, { id: 2, shiny: true }]);
      expect(saved.artifacts).to.deep.equal([3]);
      expect(JSON.parse(localStorage.getItem('underscript.deck.7.KINDNESS.4'))).to.deep.equal({
        cards: [{ id: 1 }, { id: 2, shiny: true }],
        artifacts: [3],
      });
    });

    it('does not save an empty deck, an unknown soul, or to a bad slot', async () => {
      server = current([], []);
      const failures = await Promise.all([
        decks.save('KINDNESS', 0).catch((e) => e.message),
        decks.save('BRAVERY', 0).catch((e) => e.message),
        decks.save('KINDNESS', -1).catch((e) => e.message),
        decks.save('KINDNESS', 1.5).catch((e) => e.message),
        decks.save('', 0).catch((e) => e.message),
      ]);
      expect(failures).to.deep.equal([
        'Nothing to save',
        'Unknown soul: BRAVERY',
        'A slot is required',
        'A slot is required',
        'A soul is required',
      ]);
      expect(localStorage.length).to.equal(0);
    });
  });
});
