import eventManager from 'src/utils/eventManager';
import chat from 'src/structures/chat/chat';
import * as settings from 'src/utils/settings/index';
import { global, globalSet } from 'src/utils/global';
import * as fnUser from 'src/utils/user';
import { register, highlight } from 'src/utils/autocomplete';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('autocomplete'),
  key: 'underscript.autocomplete',
  default: true,
  page: 'Chat',
});

const lists = {};
const avatars = {};

register({
  name: 'users',
  prefix: '@',
  options({ room, text }) {
    const list = [...(lists[room] || [])];
    eventManager.emit('@autocomplete', {
      list,
    });
    const query = text.toUpperCase();
    return list.reverse()
      .filter((name) => name.toUpperCase().startsWith(query))
      .map((name) => ({ value: name, avatar: avatars[name] }));
  },
  render({ value, avatar }, text) {
    const entry = document.createDocumentFragment();
    if (avatar && !settings.value('chatAvatarsDisabled')) {
      const image = document.createElement('img');
      image.height = 24;
      image.src = `/images/avatars/${avatar.image}.${avatar.extension || 'png'}`;
      image.className = `avatar ${avatar.rarity || ''}`.trim();
      entry.append(image, ' ');
    }
    entry.append(highlight(value, text));
    return entry;
  },
});

function add(user, list) {
  const name = fnUser.name(user);
  if (!list || name === global('selfUsername')) return;
  if (user.avatar) avatars[name] = user.avatar;
  const slot = list.indexOf(name);
  if (slot > -1) list.splice(slot, 1);
  list.push(name);
}

chat.on('history', ({ channel: { room }, messages }) => {
  if (lists[room] === undefined) {
    lists[room] = [];
  }
  const list = lists[room];
  messages.forEach(({ author }) => add(author.raw, list));
});
chat.on('message', ({ channel, author }) => {
  if (channel.type !== 'public') return;
  add(author.raw, lists[channel.room]);
});
eventManager.on('ChatDetected', () => {
  globalSet('autoComplete', function autoComplete(...args) {
    if (setting.value()) return;
    this.super(...args);
  }, {
    throws: false,
  });
});
