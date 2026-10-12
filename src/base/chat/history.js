import eventManager from 'src/utils/eventManager';
import chat from 'src/structures/chat/chat';
import * as settings from 'src/utils/settings/index';
import Translation from 'src/structures/constants/translation';
import { createChatHistory } from 'src/utils/chatHistory';

const setting = settings.register({
  name: Translation.Setting('chat.history'),
  key: 'underscript.disable.chat.history',
  page: 'Chat',
});

const history = createChatHistory({ storage: localStorage });

chat.on('message', ({ channel, raw, timestamp }) => {
  if (setting.value() || channel.type !== 'public') return;
  history.add(channel.id, { ...raw, timestamp: timestamp ?? Date.now() });
});

eventManager.on('preChat:getSelfInfos', () => {
  if (!setting.value()) history.restore();
});

eventManager.on('Chat:deleteMessages', ({ idUser }) => {
  history.removeUser(JSON.parse(idUser));
});

eventManager.on(':unload', () => history.flush());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) history.flush();
});
