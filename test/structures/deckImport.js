import { expect } from 'chai';
import decks, { attachSlots } from '../../src/structures/deck/decks';
import { getSaved, parseDeckCode } from '../../src/structures/deck/saved';

const encode = (data) => btoa(JSON.stringify(data));
const code = (extra = {}) => encode({ soul: 'KINDNESS', cardIds: [5, 5, 9], artifactIds: [2, 4], ...extra });
const store = (soul, index, deck = { cards: [{ id: 1 }], artifacts: [] }) => {
  localStorage.setItem(`underscript.deck.7.${soul}.${index}`, JSON.stringify(deck));
};

describe('deck code', () => {
  it('reads the game\'s deck code', () => {
    expect(parseDeckCode(code())).to.deep.equal({
      soul: 'KINDNESS',
      cards: [{ id: 5, shiny: false }, { id: 5, shiny: false }, { id: 9, shiny: false }],
      artifacts: [2, 4],
      name: undefined,
      description: undefined,
      meta: {},
    });
  });

  it('reads the old name for the soul, and a missing artifact list', () => {
    const deck = parseDeckCode(encode({ classe: 'BRAVERY', cardIds: [1] }));
    expect(deck.soul).to.equal('BRAVERY');
    expect(deck.artifacts).to.deep.equal([]);
  });

  it('reads the extra fields', () => {
    const deck = parseDeckCode(code({
      name: 'Rush',
      description: 'Quick',
      cardShiny: [false, true, false],
      meta: { A: { k: 1 }, B: 'not an object', C: [] },
    }));
    expect(deck.name).to.equal('Rush');
    expect(deck.description).to.equal('Quick');
    expect(deck.cards.map(({ shiny }) => shiny)).to.deep.equal([false, true, false]);
    expect(deck.meta).to.deep.equal({ A: { k: 1 } });
  });

  it('ignores a shiny list that does not line up', () => {
    const deck = parseDeckCode(code({ cardShiny: [true] }));
    expect(deck.cards.every(({ shiny }) => shiny === false)).to.equal(true);
  });

  it('refuses what the game would refuse', () => {
    const bad = [
      'not base64 !!',
      btoa('not json'),
      btoa('[]'),
      code({ soul: undefined }),
      code({ cardIds: [] }),
      code({ cardIds: Array.from({ length: 26 }, (_, i) => i + 1) }),
      code({ artifactIds: [1, 2, 3] }),
      code({ cardIds: [1, 'x'] }),
      code({ cardIds: 'nope' }),
      code({ artifactIds: ['a'] }),
      undefined,
      5,
    ];
    bad.forEach((value) => expect(() => parseDeckCode(value), `${value}`).to.throw('Invalid deck code'));
  });
});

describe('deck import', () => {
  beforeEach(() => {
    globalThis.selfId = 7;
    attachSlots(() => 5);
  });

  afterEach(() => {
    delete globalThis.selfId;
    attachSlots(() => 5);
  });

  it('saves into the slot it is given', () => {
    const saved = decks.import(code({ name: 'Rush' }), { slot: 3 });
    expect(saved).to.equal(getSaved('KINDNESS', 3));
    expect(saved.cards.map(({ id }) => id)).to.deep.equal([5, 5, 9]);
    expect(saved.artifacts).to.deep.equal([2, 4]);
    expect(saved.name).to.equal('Rush');
  });

  it('takes the first free slot for the soul when it is not given one', () => {
    store('KINDNESS', 0);
    store('KINDNESS', 1);
    store('BRAVERY', 2);
    expect(decks.import(code()).index).to.equal(2);
    expect(decks.import(code()).index).to.equal(3);
    expect(decks.import(encode({ soul: 'BRAVERY', cardIds: [1] })).index).to.equal(0);
  });

  it('fills a gap before going on', () => {
    store('KINDNESS', 0);
    store('KINDNESS', 2);
    expect(decks.import(code()).index).to.equal(1);
  });

  it('goes past the storage buttons when they are all taken', () => {
    [0, 1, 2, 3, 4].forEach((slot) => store('KINDNESS', slot));
    expect(decks.import(code()).index).to.equal(5);
    expect(decks.import(code()).index).to.equal(6);
  });

  it('says how many slots the storage buttons show', () => {
    expect(decks.visibleSlots()).to.equal(5);
    attachSlots(() => 15);
    expect(decks.visibleSlots()).to.equal(15);
  });

  it('replaces what a slot held, including its name, description and meta', () => {
    store('KINDNESS', 1, { cards: [{ id: 1 }], artifacts: [8] });
    const old = getSaved('KINDNESS', 1);
    old.name = 'Old';
    old.description = 'Old text';
    old.setMeta('A', 'k', 1);
    old.setMeta('Old plugin', 'k', 1);
    const saved = decks.import(code({ meta: { A: { k: 2 } } }), { slot: 1 });
    expect(saved.cards.length).to.equal(3);
    expect(saved.name).to.equal(undefined);
    expect(saved.description).to.equal(undefined);
    expect(saved.allMeta()).to.deep.equal({ A: { k: 2 } });
  });

  it('can leave the meta out', () => {
    const saved = decks.import(code({ name: 'Rush', meta: { A: { k: 1 } } }), { slot: 0, meta: false });
    expect(saved.name).to.equal('Rush');
    expect(saved.allMeta()).to.deep.equal({});
  });

  it('refuses a bad slot and a bad code before changing anything', () => {
    store('KINDNESS', 0);
    const before = JSON.stringify(Object.entries(localStorage));
    expect(() => decks.import(code(), { slot: -1 })).to.throw('A slot is required');
    expect(() => decks.import(code(), { slot: 1.5 })).to.throw('A slot is required');
    expect(() => decks.import('nope')).to.throw('Invalid deck code');
    expect(JSON.stringify(Object.entries(localStorage))).to.equal(before);
  });

  it('refuses when the player is not known', () => {
    delete globalThis.selfId;
    expect(() => decks.import(code(), { slot: 0 })).to.throw('Not logged in');
  });

  it('gives back an exported deck, with its shinies and meta', () => {
    store('KINDNESS', 0, { cards: [{ id: 5 }, { id: 9, shiny: true }], artifacts: [2] });
    const original = getSaved('KINDNESS', 0);
    original.name = 'Déck 名前';
    original.description = 'çà';
    original.setMeta('A', 'tags', ['x']);
    const copy = decks.import(original.export({ shiny: true }), { slot: 3 });
    expect(copy.cards).to.deep.equal(original.cards);
    expect(copy.artifacts).to.deep.equal(original.artifacts);
    expect(copy.name).to.equal('Déck 名前');
    expect(copy.description).to.equal('çà');
    expect(copy.allMeta()).to.deep.equal({ A: { tags: ['x'] } });
  });

  it('loses the shinies when the export did not list them', () => {
    store('KINDNESS', 0, { cards: [{ id: 9, shiny: true }], artifacts: [] });
    const copy = decks.import(getSaved('KINDNESS', 0).export(), { slot: 1 });
    expect(copy.cards).to.deep.equal([{ id: 9, shiny: false }]);
  });
});
