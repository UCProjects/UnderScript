import eventManager from 'src/utils/eventManager';
import chat from 'src/structures/chat/chat';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import style from 'src/utils/style';
import { infoToast } from 'src/utils/2.toasts';
import Translation from 'src/structures/constants/translation';

const tag = settings.register({
  name: Translation.Setting('tag.opponent'),
  key: 'underscript.tag.opponent',
  default: true,
  page: 'Chat',
});

style.add('.opponent { color: #d94f41 !important; }');

eventManager.on('PlayingGame', function tagOpponent() {
  let toast;
  /** @param {UnderScriptChatMessage} message */
  function processMessage(message) {
    const room = message.channel.room;
    if (message.author.id === global('opponentId') && tag.value()) {
      if (!toast) {
        toast = infoToast('<span class="opponent">Opponents</span> are now highlighted in chat.', 'underscript.notice.highlighting.opponent', '1');
      }
      $(`#${room} #message-${message.id} .chat-user`).addClass('opponent');
      if (message.emote) { // emotes
        $(`#${room} #message-${message.id} .chat-message`).addClass('opponent');
      }
    }
  }

  chat.on('history', ({ messages }) => {
    messages.forEach(processMessage);
  });
  chat.on('message', (message) => {
    if (message.channel.type === 'public') processMessage(message);
  });
});
