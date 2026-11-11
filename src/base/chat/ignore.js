/* eslint-disable consistent-return */
import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import * as fnUser from 'src/utils/user';
import pendingIgnore from 'src/utils/pendingIgnore';
import { debug } from 'src/utils/debug';
import { chat, chatMessage } from 'src/utils/debugFlags';
import Translation from 'src/structures/constants/translation';
import Counter from 'src/utils/Counter';

const setting = settings.register({
  name: Translation.Setting('ignore'),
  key: 'underscript.disable.ignorechat',
  page: 'Chat',
  category: Translation.CATEGORY_CHAT_IGNORED,
});

const how = settings.register({
  name: Translation.Setting('ignore.how'),
  key: 'underscript.ignorechat.how',
  type: 'select',
  options: [
    [Translation.Setting('ignore.option.1'), 'remove'],
    [Translation.Setting('ignore.option.2'), 'hide'],
    [Translation.Setting('ignore.option.3'), 'none'],
  ],
  page: 'Chat',
  category: Translation.CATEGORY_CHAT_IGNORED,
});

const count = new Counter();

// This isn't really the best name to call this function
export default function shouldIgnore(message, self = false) {
  // Ignoring is disabled?
  if (setting.value()) return false;
  const user = message.user;
  const id = user.id;
  // Is it your own message?
  if (id === global('selfId')) return self;
  // Is user mod?
  if (fnUser.isMod(user)) return false;
  // Ignoring user?
  return !!settings.value(`underscript.ignore.${id}`);
}

function createContainer(room, msg, history) {
  count.value = 1;
  const container = $('<li class="ignored-chat">');
  if (history) {
    msg.after(container);
    msg.remove();
  } else {
    $(`#${room} .chat-messages`).append(container);
    global('scroll')($(`#${room}`), true);
  }
  $(`#${room}`).data('container', container);
  return container;
}

function processMessage(message, room, history = false) {
  debug(message, chatMessage);
  if (!shouldIgnore(message) || global('isFriend')(message.user.id)) {
    $(`#${room}`).removeData('container');
    return;
  }

  const msg = $(`#${room} #message-${message.id}`);
  const type = how.value();
  if (type === 'hide') {
    if (!history) {
      pendingIgnore.set(true);
      return;
    }
    msg.find(`.chat-message`)
      .html(`<span class="gray">${Translation.General('message.hidden')}</span>`)
      .removeClass().addClass('chat-message');
  } else if (type === 'remove') {
    debug(`removed ${fnUser.name(message.user)}`, chat);
    const existing = $(`#${room}`).data('container');
    const container = existing || createContainer(room, msg, history);
    if (existing && history) msg.remove();
    container.text(Translation.General('message.removed').translate(count.value));
    count.next();
    return true;
  } else if (type === 'none') {
    if (history) msg.remove();
    else return true;
  }
}

eventManager.on('Chat:getHistory', (data) => {
  JSON.parse(data.history).forEach((message) => {
    processMessage(message, data.room, true);
  });
});

eventManager.on('preChat:getMessage', function preProcess(data) {
  if (this.canceled) return;
  this.canceled = processMessage(JSON.parse(data.chatMessage), data.room);
});

eventManager.on('Chat:getMessage', function hideMessage(data) {
  if (how.value() !== 'hide') return;
  const message = JSON.parse(data.chatMessage);
  if (!shouldIgnore(message) || global('isFriend')(message.user.id)) return;
  $(`#${data.room} #message-${message.id} .chat-message`)
    .html(`<span class="gray">${Translation.General('message.hidden')}</span>`)
    .removeClass().addClass('chat-message');
});
