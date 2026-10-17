import { channelFromRoom, getChannel } from './chat';
import { deletedSince, stamp } from './deletion';

const STAFF_PRIORITY = 6;
const MOD_PRIORITY = 4;

type Raw = Record<string, unknown>;

type MessageFields = Pick<
  UnderScriptChatMessage,
  'id' | 'channel' | 'author' | 'text' | 'emote' | 'rainbow' | 'deleted' | 'timestamp' | 'raw'
>;

const originals = new WeakMap<Element, string>();

export class ChatMessage implements UnderScriptChatMessage {
  readonly id: MessageFields['id'];
  readonly channel: MessageFields['channel'];
  readonly author: MessageFields['author'];
  readonly text: MessageFields['text'];
  readonly emote: MessageFields['emote'];
  readonly rainbow: MessageFields['rainbow'];
  readonly timestamp: MessageFields['timestamp'];
  readonly raw: MessageFields['raw'];
  readonly #removed: boolean;
  readonly #stampedAt: number;

  constructor(fields: MessageFields) {
    this.id = fields.id;
    this.channel = fields.channel;
    this.author = fields.author;
    this.text = fields.text;
    this.emote = fields.emote;
    this.rainbow = fields.rainbow;
    this.#removed = fields.deleted;
    this.#stampedAt = stamp();
    this.timestamp = fields.timestamp;
    this.raw = fields.raw;
    Object.freeze(this);
  }

  get deleted(): boolean {
    return this.#removed || (this.channel.type === 'public' && deletedSince(this.author.id, this.#stampedAt));
  }

  get element(): HTMLElement | null {
    const room = document.getElementById(this.channel.room);
    const id = `message-${this.id}`.replace(/["\\]/g, '');
    return room?.querySelector<HTMLElement>(`[id="${id}"]`) ?? null;
  }

  get #body(): HTMLElement | null {
    return this.element?.querySelector<HTMLElement>('.chat-message') ?? null;
  }

  display(text: string, { html = false }: { html?: boolean } = {}): boolean {
    const target = this.#body;
    if (!target) return false;
    if (!originals.has(target)) originals.set(target, target.innerHTML);
    if (html) {
      target.innerHTML = text;
    } else {
      target.textContent = text;
    }
    return true;
  }

  restore(): boolean {
    const target = this.#body;
    const original = target ? originals.get(target) : undefined;
    if (!target || original === undefined) return false;
    target.innerHTML = original;
    originals.delete(target);
    return true;
  }
}

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecord(value: unknown): Raw | undefined {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return isRecord(value) ? value : undefined;
}

function parseGroup(value: unknown): UnderScriptChatGroup | undefined {
  if (!isRecord(value)) return undefined;
  const { id, name, priority, icon } = value;
  if (typeof name !== 'string') return undefined;
  return {
    id: typeof id === 'number' || typeof id === 'string' ? id : name,
    name,
    priority: typeof priority === 'number' ? priority : Infinity,
    icon: typeof icon === 'string' ? icon : undefined,
  };
}

function parseUser(value: unknown): UnderScriptChatUser | undefined {
  if (!isRecord(value)) return undefined;
  const { id, username, avatar, shinyAvatar, division, mainGroup, groups } = value;
  if ((typeof id !== 'number' && typeof id !== 'string') || typeof username !== 'string') return undefined;
  const main = parseGroup(mainGroup);
  const priority = main?.priority ?? Infinity;
  const avatarInfo = isRecord(avatar) && typeof avatar.image === 'string' ?
    { image: avatar.image, rarity: typeof avatar.rarity === 'string' ? avatar.rarity : '' } :
    undefined;
  return {
    id,
    name: username,
    avatar: avatarInfo,
    shinyAvatar: shinyAvatar === true,
    division: typeof division === 'string' ? division : '',
    mainGroup: main,
    groups: Array.isArray(groups) ? groups.map(parseGroup).filter((group) => group !== undefined) : [],
    isStaff: priority <= STAFF_PRIORITY,
    isMod: priority <= MOD_PRIORITY,
    raw: value,
  };
}

export function channelFromData(data: unknown): UnderScriptChatChannel | undefined {
  if (!isRecord(data)) return undefined;
  if (typeof data.room === 'string') return channelFromRoom(data.room);
  const { action, idRoom, idFriend } = data;
  if (action === 'getMessage' && idRoom !== undefined) {
    return getChannel('public', `${idRoom}`);
  }
  if (action === 'getPrivateMessage' && idFriend !== undefined) {
    return getChannel('private', `${idFriend}`);
  }
  return undefined;
}

export function parseChatMessage(
  value: unknown,
  channel: UnderScriptChatChannel,
  receivedAt?: number,
): ChatMessage | undefined {
  const raw = toRecord(value);
  if (!raw) return undefined;
  const { id, message, me, rainbow, deleted, timestamp } = raw;
  const author = parseUser(raw.user);
  if (!author || typeof message !== 'string') return undefined;
  if (typeof id !== 'number' && typeof id !== 'string') return undefined;
  return new ChatMessage({
    id,
    channel,
    author,
    text: message,
    emote: me === true,
    rainbow: rainbow === true,
    deleted: deleted === true,
    timestamp: typeof timestamp === 'number' ? timestamp : receivedAt,
    raw,
  });
}
