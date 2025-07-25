import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import { toast as SimpleToast } from 'src/utils/2.toasts.js';
import isFriend from 'src/utils/isFriend.js';
import Translation from 'src/structures/constants/translation.ts';

const category = Translation.Setting('category.announce.winstreak');

const setting = settings.register({
  name: Translation.Setting('announce'),
  key: 'underscript.winstreak',
  options: ['Chat', 'Toast', 'Both', 'Hidden'],
  default: 'Both',
  type: 'select',
  page: 'Chat',
  category,
});

const friends = settings.register({
  name: Translation.Setting('announce.friendsOnly'),
  key: 'underscript.winstreak.friendsOnly',
  page: 'Chat',
  category,
});

const toasts = {
  v: [],
  i: 0,
  add(toast) {
    this.v[this.i]?.close();
    this.v[this.i] = toast;
    this.i = (this.i + 1) % 3;
    return toast;
  },
};
function checkFriend(name) {
  return !friends.value() || isFriend(name);
}
function checkCount(amt) {
  // return parseInt(amt, 10) >= settings.value('underscript.winstreak.count');
  return true;
}
const events = ['chat-user-ws', 'chat-user-ws-stop'];
eventManager.on('preChat:getMessageAuto', function winstreaks(data) {
  const message = JSON.parse(JSON.parse(data.message).args);
  if (this.canceled || !events.includes(message[0])) return;
  const handling = setting.value();
  if (handling === 'Chat' && !friends.value()) return; // All default
  this.canceled = handling !== 'Chat' && handling !== 'Both';
  if (handling === 'Hidden') return;
  const username = message[message.length - 2];
  const streak = message[message.length - 1];
  if (!checkFriend(username) || !checkCount(streak)) {
    this.canceled = true;
    return;
  }
  // At this point Toast is guaranteed
  const toast = toasts.add(SimpleToast({
    text: global('translateFromServerJson')(data.message),
    // timeout: 10000,
    css: {
      color: 'yellow',
      footer: { color: 'white' },
    },
  }));
  toast.time = Date.now();
});
