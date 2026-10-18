import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import { attach } from 'src/structures/deck/write';

function setQuantities(soul, ids, shinies, quantities) {
  const collection = global('deckCollections')[soul] || [];
  ids.forEach((id, index) => {
    collection.forEach((card) => {
      if (card.id === id && card.shiny === shinies[index]) card.quantity = quantities[index];
    });
  });
}

function update(action, soul, data) {
  const decks = global('decks');
  const artifacts = global('decksArtifacts');
  switch (action) {
    case 'addCard': {
      const card = JSON.parse(data.card);
      global('updateQuantity')(soul, card, -1);
      global('addDeckCardSlot')(soul, card);
      break;
    }
    case 'removeCard': {
      const card = JSON.parse(data.card);
      global('updateQuantity')(soul, card, 1);
      global('removeDeckCardSlot')(soul, card);
      break;
    }
    case 'removeAllCards':
      setQuantities(soul, JSON.parse(data.cardsId), JSON.parse(data.cardsShiny), JSON.parse(data.cardsQuantity));
      decks[soul] = [];
      artifacts[soul] = [];
      break;
    case 'addArtifact':
      artifacts[soul].push(JSON.parse(data.artifact));
      break;
    default:
      artifacts[soul] = [];
  }
}

onPage('Decks', () => {
  attach({
    apply({ action, soul }, data) {
      if (!global('decks', { throws: false })?.[soul]) return;
      update(action, soul, data);
      global('refreshDeckList')();
      global('updateArtifactSlots')();
      global('applyFilters')();
      global('showPage')(global('currentPage'));
    },
  });
});
