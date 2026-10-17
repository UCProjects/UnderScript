import eventEmitter from 'src/utils/eventEmitter';
import * as api from 'src/utils/4.api';
import { openChannels } from './channel';
import { channelFromRoom } from './message';
import { arm, createPending } from './pending';

type Hooks = {
  connected(): boolean;
  reconnect(): void;
  send(channel: UnderScriptChatChannel, text: string): boolean;
};

const events = eventEmitter<UnderScriptChatEvents>();
let hooks: Hooks | undefined;
let replaced = false;

const chat: UnderScriptChat = {
  get connected() {
    return hooks?.connected() ?? false;
  },
  get replaced() {
    return replaced;
  },
  get channels() {
    return openChannels();
  },
  on(event, listener) {
    events.on(event, listener);
    return chat;
  },
  once(event, listener) {
    events.once(event, listener);
    return chat;
  },
  off(event, listener) {
    events.off(event, listener);
    return chat;
  },
  reconnect() {
    hooks?.reconnect();
  },
  send(channel, text) {
    const target = typeof channel === 'string' ? channelFromRoom(channel) : channel;
    if (!hooks || typeof text !== 'string' || !text || !target) {
      return Promise.resolve({ status: 'canceled' });
    }
    const pending = createPending();
    arm(target, pending);
    hooks.send(target, text);
    return pending.promise;
  },
};

export function attach(next: Hooks): void {
  hooks = next;
}

export function emit<K extends keyof UnderScriptChatEvents>(
  event: K,
  ...args: UnderScriptChatEvents[K]
): void {
  if (event === 'replaced') replaced = true;
  if (event === 'connected' || event === 'reconnected') replaced = false;
  events.emit(event, ...args);
}

export function emitCancelable<K extends keyof UnderScriptChatEvents>(
  event: K,
  canceled: boolean,
  ...args: UnderScriptChatEvents[K]
): boolean {
  return events.emit({ cancelable: true, canceled }, event, ...args).canceled;
}

api.register('chat', Object.freeze({
  get connected() {
    return chat.connected;
  },
  get replaced() {
    return chat.replaced;
  },
  get channels() {
    return chat.channels;
  },
}) satisfies UnderScriptChatState);

export default chat;
