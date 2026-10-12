import chat from 'src/structures/chat/chat';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import { infoToast } from 'src/utils/2.toasts';
import style from 'src/utils/style';
import Translation from 'src/structures/constants/translation';
import styles from './tag.friend.css';

const tag = settings.register({
  name: Translation.Setting('tag.friend'),
  key: 'underscript.tag.friend',
  default: true,
  page: 'Chat',
});

const color = settings.register({
  name: Translation.Setting('tag.friend.color'),
  key: 'underscript.tag.friend.color',
  type: 'color',
  default: '#b1bfbe',
  page: 'Chat',
  onChange: setColor,
  reset: true,
});

style.add(styles);
setColor(color.value());

let toast;
/** @param {UnderScriptChatMessage} message */
function processMessage(message) {
  if (!tag.value()) return;
  const room = message.channel.room;
  if (global('isFriend')(message.author.id)) {
    if (!toast) {
      toast = infoToast('<span class="friend">Friends</span> are now highlighted in chat.', 'underscript.notice.highlighting', '1');
    }
    $(`#${room} #message-${message.id} .chat-user`).addClass('friend');
    if (message.emote) { // emotes
      $(`#${room} #message-${message.id} .chat-message`).addClass('friend');
    }
  }
}

chat.on('history', ({ messages }) => {
  messages.forEach(processMessage);
});
chat.on('message', (message) => {
  if (message.channel.type === 'public') processMessage(message);
});

function setColor(newColor) {
  document.documentElement.style.setProperty('--underscript-friend-color', newColor);
}
