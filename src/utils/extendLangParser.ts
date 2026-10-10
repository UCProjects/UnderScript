import eventManager from 'src/utils/eventManager';

let loaded = false;

type ParserExtension = Record<string, (nodes: any[]) => unknown>;

function extend(data: ParserExtension): void {
  $.extend($.i18n.parser.emitter, data);
}

eventManager.on('translation:loaded', () => loaded = true);

export default function extendLangParser(data: ParserExtension = {}): void {
  if (loaded) {
    extend(data);
  } else {
    eventManager.on('translation:loaded', () => extend(data));
  }
}
