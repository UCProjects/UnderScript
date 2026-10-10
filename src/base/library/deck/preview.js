import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { globalSet } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('deck.preview'),
  key: 'underscript.disable.deckPreview',
  // hidden: typeof displayCardDeck === 'function',
  onChange(val, val2) {
    if (!onPage('Decks') || typeof cardHoverEnabled === 'undefined') return;
    globalSet('cardHoverEnabled', !val);
  },
  page: 'Library',
});

eventManager.on(':preload:Decks', function previewLoaded() {
  if (typeof displayCardDeck === 'function') {
    globalSet('cardHoverEnabled', !setting.value());
  }
});
