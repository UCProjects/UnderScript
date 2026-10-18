import { SOCKET_SCRIPT_CLOSED, isApp, window } from 'src/utils/1.variables';
import eventManager from 'src/utils/eventManager';
import { debug } from 'src/utils/debug';
import { rawChat } from 'src/utils/debugFlags';
import { global, globalSet } from 'src/utils/global';
import VarStore from 'src/utils/VarStore';
import { attach } from 'src/utils/autocomplete';
import { toast as Toast } from 'src/utils/2.toasts';
import chat, {
  attach as attachChat,
  channelFromRoom,
  emit as emitChat,
  emitCancelable as emitChatCancelable,
} from 'src/structures/chat/chat';
import { channelFromData, parseChatMessage } from 'src/structures/chat/message';
import { setSelfOnline, syncFriends, syncSelf } from 'src/structures/chat/user';
import { eventOf, parseNotice } from 'src/structures/chat/notice';
import parseDeletion, { recordDeletion } from 'src/structures/chat/deletion';
import { emitSend } from 'src/structures/chat/outgoing';
import {
  claim,
  echoed,
  forgetAll,
  refused,
  submitted,
} from 'src/structures/chat/pending';
import Translation from 'src/structures/constants/translation';
import {
  canReconnect,
  createFlapGuard,
  createPolicy,
  isSessionReplaced,
} from 'src/utils/chatReconnect';
import { isActive, updateIfActive } from './session';

// TODO: Use Message object
// TODO: Better history management
let reconnectAttempts = 0;
const policy = createPolicy(isApp, SOCKET_SCRIPT_CLOSED);
const flaps = createFlapGuard();
const guestMode = new VarStore(false);
const historyIds = new Set();

function handleClose(event) {
  forgetAll();
  setSelfOnline(false);
  console.debug('Disconnected', event);
  flaps.closed(Date.now());
  if (isSessionReplaced(event.reason)) emitChat('replaced');
  if (!policy.retries(event.code, event.reason)) return;
  setTimeout(reconnect, Math.max(policy.delay(reconnectAttempts), isApp ? flaps.penalty() : 0));
}

const parsed = new WeakMap();

function parsedMessage(data) {
  if (data.action !== 'getMessage' && data.action !== 'getPrivateMessage') return undefined;
  if (!parsed.has(data)) {
    const channel = channelFromData(data);
    parsed.set(data, channel && parseChatMessage(data.chatMessage, channel, Date.now()));
  }
  return parsed.get(data);
}

function emitMessage(data) {
  const message = parsedMessage(data);
  if (message) emitChat('message', message);
}

function translateFromServer(message) {
  return global('translateFromServerJson', { throws: false })?.(message);
}

const notices = new WeakMap();

function readNotice(data) {
  if (!notices.has(data)) {
    const notice = parseNotice(data, translateFromServer);
    notices.set(data, notice && { notice, event: eventOf(notice) });
  }
  return notices.get(data);
}

function emitNotice(data) {
  const read = readNotice(data);
  if (read) emitChat(read.event, read.notice);
}

function emitDeleted(data) {
  const deletion = parseDeletion(data);
  if (!deletion) return;
  recordDeletion(deletion.userId);
  emitChat('deleted', deletion);
}

function settleSends(data) {
  const message = parsedMessage(data);
  if (message) echoed(message, global('selfId', { throws: false }));
  const read = readNotice(data);
  if (read?.event === 'rejected') refused(read.notice);
}

function preMessageCanceled(data, canceled) {
  const message = parsedMessage(data);
  if (!message) return canceled;
  return emitChatCancelable('preMessage', canceled, message);
}

function emitHistory({ room, history }) {
  const channel = channelFromRoom(room);
  if (!channel) return;
  const messages = JSON.parse(history)
    .map((entry) => parseChatMessage(entry, channel))
    .filter((message) => message !== undefined);
  emitChat('history', { channel, messages });
}

function bind(socketChat) {
  const oHandler = socketChat.onmessage;
  socketChat.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const { action } = data;
    debug(data, rawChat(action));

    if (action === 'getMessage' && data.idRoom) { // For new chat.
      data.room = `chat-public-${data.idRoom}`;
      data.open = global('openPublicChats').includes(data.idRoom);
    } else if (action === 'getPrivateMessage' && data.idFriend) {
      data.idRoom = data.idFriend;
      data.room = `chat-private-${data.idRoom}`;
      data.open = Array.isArray(global('privateChats')[data.idRoom]);
    }

    if (action === 'getSelfInfos') {
      syncSelf(data.me);
      syncFriends(data.friends);
    }

    eventManager.emit('preChatMessage', data);
    const raw = eventManager.cancelable.emit(`preChat:${action}`, data);
    if (preMessageCanceled(data, raw.canceled)) {
      settleSends(data);
      return;
    }
    oHandler(event);
    eventManager.emit('ChatMessage', data);
    eventManager.emit(`Chat:${action}`, data);
    emitMessage(data);
    emitNotice(data);
    settleSends(data);
    emitDeleted(data);

    if (action === 'getSelfInfos') {
      flaps.connected(Date.now());
      eventManager.singleton.emit('Chat:Connected');
      emitChat('connected');
      getMessages(data);
    }
  };
  const oClose = socketChat.onclose;
  socketChat.onclose = (e) => {
    if (e.code !== SOCKET_SCRIPT_CLOSED) oClose();
    eventManager.emit('Chat:Disconnected');
    emitChat('disconnected', { code: e.code, reason: e.reason });
    handleClose(e);
  };
}

export default function reconnect(force = false) {
  if (!force && !canReconnect(policy, {
    active: isActive(),
    guest: guestMode.isSet(),
    attempts: reconnectAttempts,
    closed: global('socketChat', { throws: false })?.readyState === WebSocket.CLOSED,
  })) return;
  reconnectAttempts += 1;
  const socket = new WebSocket(`wss://${location.hostname}/chat`);
  globalSet('socketChat', socket);
  socket.onmessage = (event) => {
    if (global('socketChat') !== socket) return;
    const data = JSON.parse(event.data);
    const { action } = data;
    switch (action) {
      case 'getSelfInfos': { // We're only connected if we get self info
        syncSelf(data.me);
        syncFriends(data.friends);
        // Reconnected
        flaps.connected(Date.now());
        socket.onmessage = global('onMessageChat');
        socket.onclose = global('onCloseChat');
        bind(socket);

        // Process Messages
        const history = getMessages(data);
        const append = global('appendMessage');
        history.forEach((message) => {
          if ($(`#message-${message.id}`).length) return;
          append(message, message.idRoom, false);
        });

        eventManager.emit('Chat:Reconnected');
        emitChat('reconnected');
        reconnectAttempts = 0;
        break;
      }
      default: {
        console.debug('Message:', action);
        // Need to stop connecting?
        socket.close(SOCKET_SCRIPT_CLOSED, 'reconnect');
      }
    }
  };
  socket.onclose = handleClose;
}

function getMessages({ discussionHistory, otherHistory }) {
  if (!discussionHistory || !otherHistory) {
    return [];
  }
  const history = [
    ...JSON.parse(discussionHistory),
    ...JSON.parse(otherHistory),
  ].filter(({ id }) => !historyIds.has(id));
  history.forEach(({ id }) => historyIds.add(id));
  return history;
}

function manualReconnect() {
  const state = global('socketChat', { throws: false })?.readyState;
  if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
  reconnectAttempts = 0;
  flaps.reset();
  reconnect(true);
}

function sendWrapper(type) {
  return function wrapper(...args) {
    const channel = channelFromRoom(`chat-${type}-${args[1]}`);
    const pending = channel && claim(channel);
    const send = () => {
      if (channel) submitted(channel, pending, args[0]);
      this.super(...args);
    };
    if (global('socketChat').readyState !== WebSocket.OPEN) {
      updateIfActive(); // TODO: Have a way to detect activity other than manually resetting it
      reconnect();
      eventManager.once('Chat:Reconnected', send);
    } else {
      send();
    }
  };
}

eventManager.on(':preload', () => {
  if (typeof socketChat !== 'undefined') {
    debug('Chat detected');
    eventManager.singleton.emit('ChatDetected');

    bind(global('socketChat'));
    attachChat({
      connected: () => global('socketChat', { throws: false })?.readyState === WebSocket.OPEN,
      reconnect: manualReconnect,
      send({ type, id }, text) {
        const send = global(type === 'public' ? 'sendMessage' : 'sendPrivateMessage', { throws: false });
        if (typeof send !== 'function') return false;
        send(text, id);
        return true;
      },
    });

    // Attempt to reconnect when sending messages
    globalSet('sendMessage', sendWrapper('public'));
    globalSet('sendPrivateMessage', sendWrapper('private'));
    // Attempt to reconnect when coming back to this window
    document.addEventListener('visibilitychange', () => reconnect());
    if (isApp) {
      window.addEventListener('online', () => {
        reconnectAttempts = 0;
        flaps.reset();
        reconnect();
      });
    }

    // Simulate old getHistory
    globalSet('appendChat', function appendChat(idRoom = '', chatMessages = [], isPrivate = true) {
      const room = `chat-${isPrivate ? 'private' : 'public'}-${idRoom}`;
      const newRoom = !document.querySelector(`#${room}`);
      const data = {
        idRoom,
        room,
        roomName: isPrivate ? '' : global('chatNames')[idRoom - 1] || '',
        history: JSON.stringify(chatMessages), // TODO: Stop stringify
      };
      if (newRoom) {
        eventManager.emit('preChat:getHistory', data);
      }
      this.super(idRoom, chatMessages, isPrivate);
      if (newRoom) {
        eventManager.emit('Chat:getHistory', data);
        emitHistory(data);
      }
    }, {
      throws: false,
    });
  }

  eventManager.on('Chat:getHistory', ({ room, roomName: name }) => {
    // Send text hook
    const messages = $(`#${room} .chat-messages`);
    const input = $(`#${room} input[type="text"]`);
    attach(input[0], { room });
    input.keydown(function sending(e) {
      if (e.key !== 'Enter') return;

      const data = {
        room,
        name,
        messages,
        input: this,
      };
      const outgoing = emitSend(room, this);
      const canceled = eventManager.emit({ cancelable: true, canceled: outgoing.canceled }, 'Chat:send', data).canceled;
      outgoing.finish(canceled);
      if (canceled) {
        debug('Canceled send');
        $(this).val('');
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });

  eventManager.on('GuestMode', () => {
    console.debug('Guest Mode');
    guestMode.set(true);
  });

  let replacedToast;
  chat.on('replaced', () => {
    if (replacedToast?.exists()) return;
    replacedToast = Toast({
      title: Translation.Toast('chat.title'),
      text: Translation.Toast('chat.replaced'),
      className: 'dismissable',
      buttons: {
        text: Translation.Toast('chat.reconnect'),
        onClick() {
          replacedToast?.close();
          manualReconnect();
        },
      },
    });
  });

  eventManager.on('Chat:Reconnected', () => {
    console.debug('Reconnected');
    replacedToast?.close();
    $('.chat-messages').find('.red:last').remove();
  });
});
