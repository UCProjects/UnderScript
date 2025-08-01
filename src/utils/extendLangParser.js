import eventManager from 'src/utils/eventManager.js';

let loaded = false;

function extend(data) {
  $.extend($.i18n.parser.emitter, data);
}

eventManager.on('translation:loaded', () => loaded = true);

export default function extendLangParser(data = {}) {
  if (loaded) {
    extend(data);
  } else {
    eventManager.on('translation:loaded', () => extend(data));
  }
}
