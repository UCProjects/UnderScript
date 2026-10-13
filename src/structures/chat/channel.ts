import { global } from 'src/utils/global';

export default class ChatChannel implements UnderScriptChatChannel {
  readonly type: 'public' | 'private';
  readonly id: string;
  readonly room: string;

  constructor(type: 'public' | 'private', id: string) {
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
}

export function openChannels(): UnderScriptChatChannel[] {
  const list: unknown = global('openPublicChats', { throws: false });
  const chats: unknown = global('privateChats', { throws: false });
  const channels: UnderScriptChatChannel[] = [];
  if (Array.isArray(list)) {
    list.forEach((id: unknown) => channels.push(new ChatChannel('public', `${id}`)));
  }
  if (typeof chats === 'object' && chats !== null) {
    Object.entries(chats)
      .filter(([, history]) => Array.isArray(history))
      .forEach(([id]) => channels.push(new ChatChannel('private', id)));
  }
  return channels;
}
