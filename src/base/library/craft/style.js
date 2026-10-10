import eventManager from 'src/utils/eventManager';

eventManager.on(':preload:Decks', () => {
  const collection = $('#collection');
  collection.css({
    width: '717px',
    padding: '0',
  });
  collection.parent().css({
    width: '717px',
  });
});
