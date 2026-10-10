import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';

function wrapper(...rest) {
  this.super(...rest);
  $('#hover-card').click(function hoverCard() {
    $(this).remove();
  });
}

eventManager.on(':preload', () => {
  const options = {
    throws: false,
  };
  globalSet('displayCardDeck', wrapper, options);
  globalSet('displayCardHelp', wrapper, options);
});
