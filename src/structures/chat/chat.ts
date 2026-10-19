import eventEmitter from 'src/utils/eventEmitter';
import * as api from 'src/utils/4.api';
import { global } from 'src/utils/global';
import ChatChannel, { openRefs, publicName, refFrom, refFromRoom } from './channel';
import type { ChannelRef, ChannelType } from './channel';
import { arm, createPending } from './pending';
import ChatUser, { findUser, findUserByName, friendUsers } from './user';

type Hooks = {
  connected(): boolean;
  reconnect(): void;
  send(channel: UnderScriptChatChannel, text: string): boolean;
  open(channel: UnderScriptChatChannel): boolean;
};

const events = eventEmitter<UnderScriptChatEvents>();
const channels = new Map<string, ChatChannel>();
let hooks: Hooks | undefined;
let replaced = false;

const chat: UnderScriptChat = {
  get connected() {
    return hooks?.connected() ?? false;
  },
  get replaced() {
    return replaced;
  },
  get self() {
    return findUser(global('selfId', { throws: false }));
  },
  get friends() {
    return friendUsers();
  },
  get channels() {
    return openRefs().map((ref) => getChannel(ref.type, ref.id));
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
  channel(name) {
    return findChannel(name);
  },
  user(who) {
    if (typeof who === 'string') return findUserByName(who) ?? findUser(who);
    return findUser(who);
  },
  open(target) {
    const channel = findChannel(target);
    if (!hooks || !channel) return undefined;
    return hooks.open(channel) ? channel : undefined;
  },
  send(channel, text) {
    const target = findChannel(channel);
    if (!hooks || typeof text !== 'string' || !text || !target) {
      return Promise.resolve({ status: 'canceled' });
    }
    const pending = createPending();
    arm(target, pending);
    hooks.send(target, text);
    return pending.promise;
  },
};

export function getChannel(type: ChannelType, id: string): ChatChannel {
  const room = `chat-${type}-${id}`;
  let channel = channels.get(room);
  if (!channel) {
    channel = new ChatChannel(chat, type, id);
    channels.set(room, channel);
  }
  return channel;
}

function channelOf(ref: ChannelRef | undefined): ChatChannel | undefined {
  return ref && getChannel(ref.type, ref.id);
}

export function channelFromRoom(room: unknown): ChatChannel | undefined {
  return channelOf(refFromRoom(room));
}

function refOf(name: unknown): ChannelRef | undefined {
  if (name instanceof ChatUser) return { type: 'private', id: `${name.id}` };
  return refFrom(name);
}

function exists({ type, id }: ChannelRef): boolean {
  if (type === 'public') return publicName(id) !== undefined;
  if (id === `${global('selfId', { throws: false })}`) return false;
  return channels.has(`chat-private-${id}`) || findUser(id) !== undefined;
}

export function findChannel(name: unknown): ChatChannel | undefined {
  if (name instanceof ChatChannel) return name;
  const ref = refOf(name);
  return ref && exists(ref) ? channelOf(ref) : undefined;
}

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
  get self() {
    return chat.self;
  },
  get friends() {
    return chat.friends;
  },
}) satisfies UnderScriptChatState);

export default chat;
