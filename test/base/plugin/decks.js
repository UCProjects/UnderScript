import { expect } from 'chai';
import axios from 'axios';
import 'src/base/plugin/logger';
import 'src/base/plugin/decks';
import { emit } from '../../../src/structures/deck/decks';

let counter = 0;

function setup() {
  counter += 1;
  const name = `Decks test ${counter}`;
  return { name, decks: globalThis.underscript.plugin(name).decks };
}

const store = (soul, index, deck) => {
  localStorage.setItem(`underscript.deck.7.${soul}.${index}`, JSON.stringify(deck));
};

describe('plugin decks', () => {
  const originalError = console.error; // eslint-disable-line no-console
  let errors;

  beforeEach(() => {
    errors = [];
    console.error = (...args) => errors.push(args); // eslint-disable-line no-console
    globalThis.selfId = 7;
  });

  afterEach(() => {
    console.error = originalError; // eslint-disable-line no-console
    delete globalThis.selfId;
  });

  describe('saved decks', () => {
    it('lists the saved decks, and finds one by soul and slot', () => {
      store('KINDNESS', 0, { cards: [{ id: 5 }], artifacts: [2] });
      store('BRAVERY', 3, { cards: [], artifacts: [] });
      const { decks } = setup();
      expect(decks.storage.list().map(({ soul, index }) => [soul, index])).to.deep.equal([['BRAVERY', 3], ['KINDNESS', 0]]);
      expect(decks.storage.list('KINDNESS').length).to.equal(1);
      expect(decks.storage.get('KINDNESS', 0).cards).to.deep.equal([{ id: 5, shiny: false }]);
      expect(decks.storage.get('KINDNESS', 1)).to.equal(undefined);
      expect(decks.storage.get('KINDNESS', -1)).to.equal(undefined);
      expect(decks.storage.get('', 0)).to.equal(undefined);
    });

    it('takes a soul constant as well as its text', async () => {
      store('BRAVERY', 0, { cards: [{ id: 5 }], artifacts: [] });
      store('KINDNESS', 0, { cards: [{ id: 6 }], artifacts: [] });
      const { decks } = setup();
      const { soul } = globalThis.underscript.constants;
      expect(decks.storage.list(soul.BRAVERY).map((deck) => deck.soul)).to.deep.equal(['BRAVERY']);
      expect(decks.storage.get(soul.BRAVERY, 0)).to.equal(decks.storage.get('BRAVERY', 0));
      expect(decks.storage.get(soul.KINDNESS, 0).cards[0].id).to.equal(6);
    });

    it('gives the same object for the same deck', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const { decks } = setup();
      expect(decks.storage.get('KINDNESS', 0)).to.equal(decks.storage.list()[0]);
    });

    it('edits the name and description', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const deck = setup().decks.storage.get('KINDNESS', 0);
      deck.name = 'Rush';
      deck.description = 'Quick';
      expect(deck.name).to.equal('Rush');
      expect(deck.description).to.equal('Quick');
    });

    it('stops reading once the deck is erased', () => {
      store('KINDNESS', 0, { cards: [{ id: 5 }], artifacts: [] });
      const deck = setup().decks.storage.get('KINDNESS', 0);
      localStorage.removeItem('underscript.deck.7.KINDNESS.0');
      expect(deck.exists).to.equal(false);
      expect(deck.cards).to.deep.equal([]);
    });
  });

  describe('meta', () => {
    it('writes to the calling plugin only, and every plugin can read all of it', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const first = setup();
      const second = setup();
      const one = first.decks.storage.get('KINDNESS', 0).meta;
      const two = second.decks.storage.get('KINDNESS', 0).meta;
      one.set('skin', 'frog');
      two.set('skin', 'toad');
      expect(one.get('skin')).to.equal('frog');
      expect(two.get('skin')).to.equal('toad');
      expect(one.of(second.name)).to.deep.equal({ skin: 'toad' });
      expect(one.all()).to.deep.equal({ [first.name]: { skin: 'frog' }, [second.name]: { skin: 'toad' } });
    });

    it('removes only the calling plugin\'s key', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const first = setup();
      const second = setup();
      const one = first.decks.storage.get('KINDNESS', 0).meta;
      const two = second.decks.storage.get('KINDNESS', 0).meta;
      one.set('k', 1);
      two.set('k', 2);
      one.remove('k');
      expect(one.get('k')).to.equal(undefined);
      expect(two.get('k')).to.equal(2);
    });

    it('is shared with the same deck seen by a later plugin object', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const { decks } = setup();
      decks.storage.get('KINDNESS', 0).meta.set('k', 1);
      expect(decks.storage.list()[0].meta.get('k')).to.equal(1);
    });
  });

  describe('writes', () => {
    let originalAdapter;
    let requests;

    beforeEach(() => {
      requests = [];
      globalThis.location = { pathname: '/' };
      originalAdapter = axios.defaults.adapter;
      axios.defaults.adapter = (config) => {
        const data = config.method === 'get' ?
          { decks: JSON.stringify([{ soul: { name: 'KINDNESS' }, cardsList: [{ id: 1, shiny: false }], artifacts: [] }]) } :
          { status: 'success', card: '{}', action: 'getArtifactAdded', soul: 'KINDNESS' };
        if (config.method !== 'get') requests.push(JSON.parse(config.data));
        return Promise.resolve({ data, status: 200, statusText: '', headers: {}, config });
      };
    });

    afterEach(() => {
      axios.defaults.adapter = originalAdapter;
      delete globalThis.location;
    });

    it('sends each change through the plugin', async () => {
      const { decks } = setup();
      const edit = await decks.addCard('KINDNESS', 5, { shiny: true });
      await decks.addArtifact('KINDNESS', 2);
      expect(edit).to.deep.equal({ soul: 'KINDNESS', action: 'addCard', id: 5, shiny: true });
      expect(requests.map(({ action }) => action)).to.deep.equal(['addCard', 'addArtifact']);
    });

    it('loads a saved deck into the current one', async () => {
      store('KINDNESS', 0, { cards: [{ id: 1 }, { id: 2 }], artifacts: [] });
      const edits = await setup().decks.storage.get('KINDNESS', 0).load();
      expect(edits).to.deep.equal([{ soul: 'KINDNESS', action: 'addCard', id: 2, shiny: false }]);
    });

    it('saves the current deck and hands back the saved deck', async () => {
      const { decks } = setup();
      const saved = await decks.storage.save('KINDNESS', 3);
      expect(saved.cards).to.deep.equal([{ id: 1, shiny: false }]);
      expect(decks.storage.get('KINDNESS', 3)).to.equal(saved);
    });

    it('exports a saved deck with every plugin\'s meta', () => {
      store('KINDNESS', 0, { cards: [{ id: 1 }], artifacts: [2] });
      const first = setup();
      const second = setup();
      first.decks.storage.get('KINDNESS', 0).meta.set('k', 1);
      const data = JSON.parse(atob(second.decks.storage.get('KINDNESS', 0).export()));
      expect(data).to.deep.equal({
        soul: 'KINDNESS',
        cardIds: [1],
        artifactIds: [2],
        meta: { [first.name]: { k: 1 } },
      });
    });

    it('imports a deck code into a slot', () => {
      const { decks } = setup();
      const code = btoa(JSON.stringify({ soul: 'BRAVERY', cardIds: [1, 2], artifactIds: [3], name: 'Shared' }));
      const saved = decks.storage.import(code, { slot: 2 });
      expect(saved).to.equal(decks.storage.get('BRAVERY', 2));
      expect(saved.cards).to.deep.equal([{ id: 1, shiny: false }, { id: 2, shiny: false }]);
      expect(saved.name).to.equal('Shared');
      expect(() => decks.storage.import('nope')).to.throw('Invalid deck code');
    });

    it('warns when an imported deck lands past the storage buttons', () => {
      const { decks } = setup();
      const code = btoa(JSON.stringify({ soul: 'BRAVERY', cardIds: [1] }));
      const original = console.warn; // eslint-disable-line no-console
      const warnings = [];
      console.warn = (...args) => warnings.push(args); // eslint-disable-line no-console
      try {
        decks.storage.import(code, { slot: 2 });
        expect(warnings.length).to.equal(0);
        const far = decks.storage.import(code, { slot: 40 });
        expect(far.index).to.equal(40);
        expect(warnings.length).to.equal(1);
        expect(warnings[0].some((arg) => `${arg}`.includes('slot 40'))).to.equal(true);
      } finally {
        console.warn = original; // eslint-disable-line no-console
      }
    });

    it('removes a saved deck with its meta', () => {
      store('KINDNESS', 0, { cards: [{ id: 1 }], artifacts: [] });
      const deck = setup().decks.storage.get('KINDNESS', 0);
      deck.meta.set('k', 1);
      deck.remove();
      expect(deck.exists).to.equal(false);
      expect(localStorage.length).to.equal(0);
    });
  });

  describe('events', () => {
    it('delivers a change to the plugin', () => {
      const { decks } = setup();
      const seen = [];
      decks.on('changed', (change) => seen.push(change));
      emit('changed', { soul: 'KINDNESS', action: 'addCard' });
      expect(seen).to.deep.equal([{ soul: 'KINDNESS', action: 'addCard' }]);
    });

    it('removes a listener by the function that was passed', () => {
      const { decks } = setup();
      let count = 0;
      const listener = () => { count += 1; };
      decks.on('changed', listener);
      emit('changed', { soul: 'KINDNESS', action: 'addCard' });
      decks.off('changed', listener);
      emit('changed', { soul: 'KINDNESS', action: 'addCard' });
      expect(count).to.equal(1);
    });

    it('runs once listeners a single time', () => {
      const { decks } = setup();
      let count = 0;
      decks.once('changed', () => { count += 1; });
      emit('changed', { soul: 'KINDNESS', action: 'addCard' });
      emit('changed', { soul: 'KINDNESS', action: 'addCard' });
      expect(count).to.equal(1);
    });

    it('logs a failing listener under the plugin name and keeps going', () => {
      const { name, decks } = setup();
      const other = setup();
      let reached = false;
      decks.on('changed', () => { throw new Error('boom'); });
      other.decks.on('changed', () => { reached = true; });
      emit('changed', { soul: 'KINDNESS', action: 'addCard' });
      expect(reached).to.equal(true);
      expect(errors.some((args) => args.some((arg) => `${arg}`.includes('boom')))).to.equal(true);
      expect(errors.some((args) => args.some((arg) => `${arg}`.includes(name)))).to.equal(true);
    });

    it('refuses a listener that is not a function', () => {
      expect(() => setup().decks.on('changed', 'nope')).to.throw('Must pass a function');
    });
  });

  describe('current', () => {
    let originalAdapter;
    let requests;

    beforeEach(() => {
      requests = [];
      globalThis.location = { pathname: '/' };
      originalAdapter = axios.defaults.adapter;
      axios.defaults.adapter = (config) => {
        requests.push(config);
        const decks = [
          { soul: { name: 'KINDNESS' }, cardsList: [{ id: 5, shiny: true, name: 'x' }, { id: 6 }], artifacts: [{ id: 2 }, { id: 4 }] },
          { soul: { name: 'BRAVERY' }, cardsList: [], artifacts: [] },
        ];
        return Promise.resolve({ data: { decks: JSON.stringify(decks) }, status: 200, statusText: 'OK', headers: {}, config });
      };
    });

    afterEach(() => {
      axios.defaults.adapter = originalAdapter;
      delete globalThis.location;
      delete globalThis.decks;
      delete globalThis.decksArtifacts;
    });

    it('asks the server away from the Decks page', async () => {
      const current = await setup().decks.current();
      expect(requests.length).to.equal(1);
      expect(current.KINDNESS).to.deep.equal({
        soul: 'KINDNESS',
        cards: [{ id: 5, shiny: true }, { id: 6, shiny: false }],
        artifacts: [2, 4],
      });
      expect(current.BRAVERY.cards).to.deep.equal([]);
    });

    it('reads the page on the Decks page without asking', async () => {
      globalThis.location.pathname = '/Decks';
      globalThis.decks = { KINDNESS: [{ id: 9, shiny: false }] };
      globalThis.decksArtifacts = { KINDNESS: [{ id: 3 }] };
      const current = await setup().decks.current();
      expect(requests.length).to.equal(0);
      expect(current.KINDNESS).to.deep.equal({ soul: 'KINDNESS', cards: [{ id: 9, shiny: false }], artifacts: [3] });
    });

    it('asks the server when the page has not loaded its decks yet', async () => {
      globalThis.location.pathname = '/Decks';
      globalThis.decks = {};
      const current = await setup().decks.current();
      expect(requests.length).to.equal(1);
      expect(Object.keys(current)).to.deep.equal(['KINDNESS', 'BRAVERY']);
    });

    it('gives nothing for a reply it cannot read', async () => {
      axios.defaults.adapter = (config) => Promise.resolve({ data: 'oops', status: 200, statusText: 'OK', headers: {}, config });
      expect(await setup().decks.current()).to.deep.equal({});
    });
  });
});
