import { expect } from 'chai';
import axios from 'axios';
import decks from '../../../../src/structures/deck/decks';

const GLOBALS = [
  'location',
  'decks',
  'decksArtifacts',
  'deckCollections',
  'currentPage',
  'updateQuantity',
  'addDeckCardSlot',
  'removeDeckCardSlot',
  'refreshDeckList',
  'updateArtifactSlots',
  'applyFilters',
  'showPage',
];

describe('deck page sync', () => {
  let originalAdapter;
  let respond;
  let calls;

  before(async () => {
    globalThis.location = { pathname: '/Decks' };
    await import('../../../../src/base/library/deck/sync');
  });

  beforeEach(() => {
    calls = [];
    globalThis.location = { pathname: '/Decks' };
    globalThis.decks = { KINDNESS: [], BRAVERY: [] };
    globalThis.decksArtifacts = { KINDNESS: [], BRAVERY: [] };
    globalThis.deckCollections = {
      KINDNESS: [{ id: 5, shiny: false, quantity: 3 }, { id: 6, shiny: false, quantity: 1 }],
      BRAVERY: [{ id: 5, shiny: false, quantity: 3 }],
    };
    globalThis.currentPage = 2;
    globalThis.updateQuantity = (soul, card, quantity) => {
      globalThis.deckCollections[soul].forEach((owned) => {
        if (owned.id === card.id && owned.shiny === card.shiny) owned.quantity += quantity;
      });
    };
    globalThis.addDeckCardSlot = (soul, card) => globalThis.decks[soul].push(card);
    globalThis.removeDeckCardSlot = (soul, card) => {
      const list = globalThis.decks[soul];
      const index = list.findIndex(({ id, shiny }) => id === card.id && shiny === card.shiny);
      if (index !== -1) list.splice(index, 1);
    };
    globalThis.refreshDeckList = () => calls.push('refreshDeckList');
    globalThis.updateArtifactSlots = () => calls.push('updateArtifactSlots');
    globalThis.applyFilters = () => calls.push('applyFilters');
    globalThis.showPage = (page) => calls.push(`showPage ${page}`);
    respond = (body) => ({
      status: 'success',
      soul: body.soul,
      card: JSON.stringify({ id: body.idCard, shiny: body.isShiny }),
      artifact: JSON.stringify({ id: body.idArtifact }),
      action: body.action === 'addArtifact' ? 'getArtifactAdded' : 'getArtifactsCleared',
      cardsId: '[5,6]',
      cardsShiny: '[false,false]',
      cardsQuantity: '[3,1]',
    });
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => {
      const body = JSON.parse(config.data);
      const data = body.action === 'removeCard' || body.action === 'removeAllCards' ?
        (({ status, ...rest }) => rest)(respond(body)) :
        respond(body);
      return Promise.resolve({ data, status: 200, statusText: '', headers: {}, config });
    };
  });

  afterEach(() => {
    axios.defaults.adapter = originalAdapter;
    GLOBALS.forEach((key) => delete globalThis[key]);
  });

  it('puts an added card into the deck and takes it out of the collection', async () => {
    await decks.addCard('KINDNESS', 5);
    expect(globalThis.decks.KINDNESS).to.deep.equal([{ id: 5, shiny: false }]);
    expect(globalThis.deckCollections.KINDNESS[0].quantity).to.equal(2);
  });

  it('updates the soul that was changed, not the one on show', async () => {
    await decks.addCard('BRAVERY', 5);
    expect(globalThis.decks.BRAVERY.length).to.equal(1);
    expect(globalThis.decks.KINDNESS.length).to.equal(0);
    expect(globalThis.deckCollections.BRAVERY[0].quantity).to.equal(2);
    expect(globalThis.deckCollections.KINDNESS[0].quantity).to.equal(3);
  });

  it('puts a removed card back', async () => {
    await decks.addCard('KINDNESS', 5);
    await decks.removeCard('KINDNESS', 5);
    expect(globalThis.decks.KINDNESS).to.deep.equal([]);
    expect(globalThis.deckCollections.KINDNESS[0].quantity).to.equal(3);
  });

  it('adds and clears artifacts', async () => {
    await decks.addArtifact('KINDNESS', 2);
    expect(globalThis.decksArtifacts.KINDNESS).to.deep.equal([{ id: 2 }]);
    await decks.clearArtifacts('KINDNESS');
    expect(globalThis.decksArtifacts.KINDNESS).to.deep.equal([]);
  });

  it('clears the deck and restores the quantities the server reports', async () => {
    await decks.addCard('KINDNESS', 5);
    await decks.addArtifact('KINDNESS', 2);
    globalThis.deckCollections.KINDNESS[0].quantity = 0;
    await decks.clear('KINDNESS');
    expect(globalThis.decks.KINDNESS).to.deep.equal([]);
    expect(globalThis.decksArtifacts.KINDNESS).to.deep.equal([]);
    expect(globalThis.deckCollections.KINDNESS.map(({ quantity }) => quantity)).to.deep.equal([3, 1]);
  });

  it('redraws the page on its current page', async () => {
    await decks.addCard('KINDNESS', 5);
    expect(calls).to.deep.equal(['refreshDeckList', 'updateArtifactSlots', 'applyFilters', 'showPage 2']);
  });

  it('leaves the page alone for a soul it does not know', async () => {
    await decks.addCard('PATIENCE', 5);
    expect(calls).to.deep.equal([]);
  });
});
