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

const MAX_PENDING = 50;
const pristine = new Map();

function readFrame(value) {
  try {
    return typeof value === 'string' ? JSON.parse(value) : structuredClone(value);
  } catch {
    return undefined;
  }
}

eventManager.on('preChatMessage', ({ action, chatMessage }) => {
  if (setting.value() || action !== 'getMessage') return;
  const frame = readFrame(chatMessage);
  if (frame?.id === undefined) return;
  pristine.set(`${frame.id}`, frame);
  if (pristine.size > MAX_PENDING) pristine.delete(pristine.keys().next().value);
});

chat.on('message', ({ channel, raw, timestamp }) => {
  const key = `${raw.id}`;
  const frame = pristine.get(key) ?? raw;
  pristine.delete(key);
  if (setting.value() || channel.type !== 'public') return;
  history.add(channel.id, { ...frame, timestamp: timestamp ?? Date.now() });
});

eventManager.on('preChat:getSelfInfos', () => {
  if (!setting.value()) history.restore();
});

chat.on('deleted', ({ userId }) => {
  history.removeUser(userId);
});

eventManager.on(':unload', () => history.flush());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) history.flush();
});
