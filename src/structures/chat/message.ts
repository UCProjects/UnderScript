const STAFF_PRIORITY = 6;
const MOD_PRIORITY = 4;
const ROOM_PATTERN = /^chat-(public|private)-(.+)$/;

type Raw = Record<string, unknown>;

type MessageFields = Pick<
UnderScriptChatMessage,
'id' | 'channel' | 'author' | 'text' | 'action' | 'rainbow' | 'deleted' | 'timestamp' | 'raw'
>;

export class ChatMessage implements UnderScriptChatMessage {
  readonly id: MessageFields['id'];
  readonly channel: MessageFields['channel'];
  readonly author: MessageFields['author'];
  readonly text: MessageFields['text'];
  readonly action: MessageFields['action'];
  readonly rainbow: MessageFields['rainbow'];
  readonly deleted: MessageFields['deleted'];
  readonly timestamp: MessageFields['timestamp'];
  readonly raw: MessageFields['raw'];

  constructor(fields: MessageFields) {
    this.id = fields.id;
    this.channel = fields.channel;
    this.author = fields.author;
    this.text = fields.text;
    this.action = fields.action;
    this.rainbow = fields.rainbow;
    this.deleted = fields.deleted;
    this.timestamp = fields.timestamp;
    this.raw = fields.raw;
    Object.freeze(this);
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

export function channelFromRoom(room: unknown): UnderScriptChatChannel | undefined {
  if (typeof room !== 'string') return undefined;
  const match = ROOM_PATTERN.exec(room);
  if (!match) return undefined;
  const [, type, id] = match;
  return { type: type as 'public' | 'private', id, room };
}

export function channelFromData(data: unknown): UnderScriptChatChannel | undefined {
  if (!isRecord(data)) return undefined;
  if (typeof data.room === 'string') return channelFromRoom(data.room);
  const { action, idRoom, idFriend } = data;
  if (action === 'getMessage' && idRoom !== undefined) {
    return { type: 'public', id: `${idRoom}`, room: `chat-public-${idRoom}` };
  }
  if (action === 'getPrivateMessage' && idFriend !== undefined) {
    return { type: 'private', id: `${idFriend}`, room: `chat-private-${idFriend}` };
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
    action: me === true,
    rainbow: rainbow === true,
    deleted: deleted === true,
    timestamp: typeof timestamp === 'number' ? timestamp : receivedAt,
    raw,
  });
}
