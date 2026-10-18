import { expect } from 'chai';
import { getSaved, listSaved } from '../../src/structures/deck/saved';

const store = (soul, index, deck, user = 7) => {
  localStorage.setItem(`underscript.deck.${user}.${soul}.${index}`, JSON.stringify(deck));
};

describe('saved decks', () => {
  beforeEach(() => {
    globalThis.selfId = 7;
  });

  afterEach(() => {
    delete globalThis.selfId;
  });

  it('lists the decks stored for the player, by soul and slot', () => {
    store('KINDNESS', 2, { cards: [], artifacts: [] });
    store('BRAVERY', 0, { cards: [], artifacts: [] });
    store('KINDNESS', 0, { cards: [], artifacts: [] });
    store('KINDNESS', 5, { cards: [], artifacts: [] }, 8);
    expect(listSaved().map(({ soul, index }) => `${soul}-${index}`)).to.deep.equal(['BRAVERY-0', 'KINDNESS-0', 'KINDNESS-2']);
    expect(listSaved('KINDNESS').map(({ index }) => index)).to.deep.equal([0, 2]);
  });

  it('ignores names, meta and anything that is not a slot', () => {
    store('KINDNESS', 0, { cards: [], artifacts: [] });
    localStorage.setItem('underscript.deck.7.KINDNESS.0.name', 'Mine');
    localStorage.setItem('underscript.deckmeta.7.KINDNESS.0.description', 'text');
    localStorage.setItem('underscript.deck.7.KINDNESS.x', '{}');
    expect(listSaved().length).to.equal(1);
  });

  it('lists nothing when the player is not known', () => {
    store('KINDNESS', 0, { cards: [], artifacts: [] });
    delete globalThis.selfId;
    expect(listSaved()).to.deep.equal([]);
  });

  it('gives the same object for the same slot', () => {
    expect(getSaved('KINDNESS', 1)).to.equal(getSaved('KINDNESS', 1));
  });

  describe('contents', () => {
    it('reads cards and artifacts', () => {
      store('KINDNESS', 0, { cards: [{ id: 5 }, { id: 9, shiny: true }], artifacts: [2, 4] });
      const deck = getSaved('KINDNESS', 0);
      expect(deck.exists).to.equal(true);
      expect(deck.cards).to.deep.equal([{ id: 5, shiny: false }, { id: 9, shiny: true }]);
      expect(deck.artifacts).to.deep.equal([2, 4]);
    });

    it('reads a deck stored as a bare list of cards', () => {
      store('KINDNESS', 0, [{ id: 5 }]);
      const deck = getSaved('KINDNESS', 0);
      expect(deck.cards).to.deep.equal([{ id: 5, shiny: false }]);
      expect(deck.artifacts).to.deep.equal([]);
    });

    it('is empty for a slot with no deck, or damaged data', () => {
      expect(getSaved('KINDNESS', 3).exists).to.equal(false);
      expect(getSaved('KINDNESS', 3).cards).to.deep.equal([]);
      localStorage.setItem('underscript.deck.7.KINDNESS.3', 'not json');
      expect(getSaved('KINDNESS', 3).exists).to.equal(false);
    });
  });

  describe('name and description', () => {
    it('reads and writes the name next to the deck', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const deck = getSaved('KINDNESS', 0);
      expect(deck.name).to.equal(undefined);
      deck.name = 'Rush';
      expect(deck.name).to.equal('Rush');
      expect(localStorage.getItem('underscript.deck.7.KINDNESS.0.name')).to.equal('Rush');
      deck.name = undefined;
      expect(localStorage.getItem('underscript.deck.7.KINDNESS.0.name')).to.equal(null);
    });

    it('keeps the description out of the deck prefix', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      const deck = getSaved('KINDNESS', 0);
      deck.description = 'Fast and loose';
      expect(deck.description).to.equal('Fast and loose');
      expect(localStorage.getItem('underscript.deckmeta.7.KINDNESS.0.description')).to.equal('Fast and loose');
      const inDeckPrefix = Object.keys(localStorage).filter((key) => key.startsWith('underscript.deck.'));
      expect(inDeckPrefix).to.deep.equal(['underscript.deck.7.KINDNESS.0']);
    });

    it('refuses to write when the player is not known', () => {
      const deck = getSaved('KINDNESS', 0);
      delete globalThis.selfId;
      expect(() => { deck.description = 'x'; }).to.throw('Not logged in');
    });
  });

  describe('meta', () => {
    beforeEach(() => store('KINDNESS', 0, { cards: [], artifacts: [] }));

    it('keeps each plugin to its own object', () => {
      const deck = getSaved('KINDNESS', 0);
      deck.setMeta('A', 'skin', 'frog');
      deck.setMeta('A', 'rank', 2);
      deck.setMeta('B', 'skin', 'toad');
      expect(deck.getMeta('A', 'skin')).to.equal('frog');
      expect(deck.metaOf('A')).to.deep.equal({ skin: 'frog', rank: 2 });
      expect(deck.allMeta()).to.deep.equal({ A: { skin: 'frog', rank: 2 }, B: { skin: 'toad' } });
    });

    it('stores one key per plugin under the meta prefix', () => {
      getSaved('KINDNESS', 0).setMeta('My.Plugin', 'a', 1);
      const stored = localStorage.getItem('underscript.deckmeta.7.KINDNESS.0.plugin.My.Plugin');
      expect(JSON.parse(stored)).to.deep.equal({ a: 1 });
      expect(getSaved('KINDNESS', 0).allMeta()).to.deep.equal({ 'My.Plugin': { a: 1 } });
    });

    it('keeps objects and lists', () => {
      const deck = getSaved('KINDNESS', 0);
      deck.setMeta('A', 'tags', ['a', 'b']);
      deck.setMeta('A', 'info', { x: 1 });
      expect(deck.getMeta('A', 'tags')).to.deep.equal(['a', 'b']);
      expect(deck.getMeta('A', 'info')).to.deep.equal({ x: 1 });
    });

    it('removes a key, and the plugin entry with its last key', () => {
      const deck = getSaved('KINDNESS', 0);
      deck.setMeta('A', 'one', 1);
      deck.setMeta('A', 'two', 2);
      deck.removeMeta('A', 'one');
      expect(deck.metaOf('A')).to.deep.equal({ two: 2 });
      deck.removeMeta('A', 'two');
      expect(localStorage.getItem('underscript.deckmeta.7.KINDNESS.0.plugin.A')).to.equal(null);
      expect(() => deck.removeMeta('A', 'missing')).to.not.throw();
    });

    it('refuses a value that is not JSON, and a missing key', () => {
      const deck = getSaved('KINDNESS', 0);
      expect(() => deck.setMeta('A', 'f', undefined)).to.throw('JSON');
      expect(() => deck.setMeta('A', '', 1)).to.throw('Key');
      expect(deck.metaOf('A')).to.deep.equal({});
    });

    it('ignores damaged data', () => {
      localStorage.setItem('underscript.deckmeta.7.KINDNESS.0.plugin.A', 'nope');
      expect(getSaved('KINDNESS', 0).metaOf('A')).to.deep.equal({});
    });
  });

  describe('erase', () => {
    it('removes the deck, its name, its description and all meta, and nothing else', () => {
      store('KINDNESS', 0, { cards: [], artifacts: [] });
      store('KINDNESS', 1, { cards: [], artifacts: [] });
      const deck = getSaved('KINDNESS', 0);
      deck.name = 'Gone';
      deck.description = 'Gone';
      deck.setMeta('A', 'k', 1);
      getSaved('KINDNESS', 1).setMeta('A', 'k', 2);
      deck.erase();
      expect(deck.exists).to.equal(false);
      expect(Object.keys(localStorage).sort()).to.deep.equal([
        'underscript.deck.7.KINDNESS.1',
        'underscript.deckmeta.7.KINDNESS.1.plugin.A',
      ]);
    });

    it('does not touch slot 1 when erasing slot 10', () => {
      store('KINDNESS', 1, { cards: [], artifacts: [] });
      store('KINDNESS', 10, { cards: [], artifacts: [] });
      getSaved('KINDNESS', 1).setMeta('A', 'k', 1);
      getSaved('KINDNESS', 10).erase();
      expect(getSaved('KINDNESS', 1).exists).to.equal(true);
      expect(getSaved('KINDNESS', 1).getMeta('A', 'k')).to.equal(1);
    });
  });
});
