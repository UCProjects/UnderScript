import { global } from 'src/utils/global';

export type ChannelType = 'public' | 'private';

export type ChannelRef = {
  readonly type: ChannelType;
  readonly id: string;
};

export type ChannelOwner = {
  send(channel: UnderScriptChatChannel, text: string): Promise<UnderScriptChatSendResult>;
};

const ROOM_PATTERN = /^chat-(public|private)-(.+)$/;

export default class ChatChannel implements UnderScriptChatChannel {
  readonly type: ChannelType;
  readonly id: string;
  readonly room: string;
  readonly #owner: ChannelOwner;

  constructor(owner: ChannelOwner, type: ChannelType, id: string) {
    this.#owner = owner;
    this.type = type;
    this.id = id;
    this.room = `chat-${type}-${id}`;
    Object.freeze(this);
  }

  get name(): string | undefined {
    if (this.type !== 'public') return undefined;
    const names: unknown = global('chatNames', { throws: false });
    if (!Array.isArray(names)) return undefined;
    const name: unknown = names[Number(this.id) - 1];
    return typeof name === 'string' ? name : undefined;
  }

  get open(): boolean {
    if (this.type === 'public') {
      const list: unknown = global('openPublicChats', { throws: false });
      return Array.isArray(list) && list.some((value) => `${value}` === this.id);
    }
    const chats = global('privateChats', { throws: false });
    return Array.isArray(chats?.[this.id]);
  }

  send(text: string): Promise<UnderScriptChatSendResult> {
    return this.#owner.send(this, text);
  }
}

export function refFromRoom(room: unknown): ChannelRef | undefined {
  if (typeof room !== 'string') return undefined;
  const match = ROOM_PATTERN.exec(room);
  if (!match) return undefined;
  const [, type, id] = match;
  return { type: type as ChannelType, id };
}

function refFromName(name: string): ChannelRef | undefined {
  const names: unknown = global('chatNames', { throws: false });
  if (!Array.isArray(names)) return undefined;
  const wanted = name.toLowerCase();
  const index = names.findIndex((value: unknown) => {
    if (typeof value !== 'string') return false;
    const key = value.toLowerCase();
    return key === wanted || key.replace(/^chat-/, '') === wanted;
  });
  return index === -1 ? undefined : { type: 'public', id: `${index + 1}` };
}

function refFromObject(value: object): ChannelRef | undefined {
  const { type, id } = value as Record<string, unknown>;
  if (type !== 'public' && type !== 'private') return undefined;
  if (typeof id === 'number' && Number.isInteger(id) && id >= 0) return { type, id: `${id}` };
  return typeof id === 'string' && id ? { type, id } : undefined;
}

export function refFrom(name: unknown): ChannelRef | undefined {
  if (typeof name === 'number') {
    return Number.isInteger(name) && name >= 0 ? { type: 'public', id: `${name}` } : undefined;
  }
  if (typeof name === 'object' && name !== null) return refFromObject(name);
  if (typeof name !== 'string') return undefined;
  const text = name.trim();
  if (/^\d+$/.test(text)) return { type: 'public', id: text };
  return refFromRoom(text) ?? refFromName(text);
}

export function openRefs(): ChannelRef[] {
  const list: unknown = global('openPublicChats', { throws: false });
  const chats: unknown = global('privateChats', { throws: false });
  const open: ChannelRef[] = [];
  if (Array.isArray(list)) {
    list.forEach((id: unknown) => open.push({ type: 'public', id: `${id}` }));
  }
  if (typeof chats === 'object' && chats !== null) {
    Object.entries(chats)
      .filter(([, history]) => Array.isArray(history))
      .forEach(([id]) => open.push({ type: 'private', id }));
  }
  return open;
}
