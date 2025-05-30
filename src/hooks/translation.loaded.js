import eventManager from 'src/utils/eventManager.js';
import { global, globalSet } from 'src/utils/global.js';

const READY = 'translationReady';
let fallback;

eventManager.on(':preload', () => {
  if (global(READY, { throws: false })) {
    eventManager.singleton.emit('translation:loaded');
  } else {
    document.addEventListener(READY, () => {
      eventManager.singleton.emit('translation:loaded', fallback);
    }, {
      once: true,
    });
  }
});

// Fallback for if translation function breaks
eventManager.on(':load', () => {
  const translationReady = global(READY, { throws: false });
  if (translationReady !== false || !$?.i18n.messageStore.messages.en) return;
  fallback = true;
  globalSet(READY, true);
  document.dispatchEvent(global('translationEvent'));
});
