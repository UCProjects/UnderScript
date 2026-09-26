import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import { register, highlight } from 'src/utils/autocomplete.js';
import Translation from 'src/structures/constants/translation.js';

const setting = settings.register({
  name: Translation.Setting('autocomplete.emotes'),
  key: 'underscript.autocomplete.emotes',
  default: true,
  page: 'Chat',
});

function code(emote) {
  return emote.code || `:${emote.name}:`;
}

function label(emote) {
  return code(emote).replace(/^:|:$/g, '');
}

function matches(value, query) {
  return value.toLowerCase().replace(/\s+/g, '').startsWith(query);
}

function exact(value, text) {
  return value.startsWith(text);
}

register({
  name: 'emotes',
  prefix: ':',
  filter: false,
  options({ text }) {
    if (!setting.value()) return [];
    const query = text.toLowerCase();
    const emotes = (global('chatEmotes', { throws: false }) || [])
      .map((emote) => ({ value: label(emote), emote }));
    return [
      ...emotes.filter(({ value }) => exact(value, text)),
      ...emotes.filter(({ value }) => !exact(value, text) && matches(value, query)),
      ...emotes.filter(({ value, emote }) => !matches(value, query) && matches(emote.name, query)),
    ];
  },
  render({ value, emote }, text) {
    const entry = document.createDocumentFragment();
    if (emote.image) {
      const image = document.createElement('img');
      image.height = 24;
      image.src = `images/emotes/${emote.image}.png`;
      entry.append(image, ' ');
    }
    entry.append(highlight(value, text));
    return entry;
  },
  insert({ emote }) {
    return `${code(emote).substring(1)} `;
  },
});
