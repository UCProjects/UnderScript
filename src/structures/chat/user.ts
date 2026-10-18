import { isMod } from 'src/utils/user';

type Raw = Record<string, unknown>;
type UserId = number | string;

type UserFields = {
  readonly name: string;
  readonly avatar?: UnderScriptChatUser['avatar'];
  readonly shinyAvatar: boolean;
  readonly division: string;
  readonly mainGroup?: UnderScriptChatGroup;
  readonly groups: ReadonlyArray<UnderScriptChatGroup>;
  readonly raw: Raw;
};

type Presence = {
  readonly friend: boolean;
  readonly online?: boolean;
  readonly gameId?: number;
};

let apply: (user: ChatUser, fields: UserFields) => void;
let present: (user: ChatUser, change: Partial<Presence>) => void;

export default class ChatUser implements UnderScriptChatUser {
  readonly id: UserId;
  #fields: UserFields;
  #presence: Presence = Object.freeze({ friend: false });

  static {
    apply = (user, fields) => {
      user.#fields = Object.freeze(fields);
    };
    present = (user, change) => {
      user.#presence = Object.freeze({ ...user.#presence, ...change });
    };
  }

  constructor(id: UserId, fields: UserFields) {
    this.id = id;
    this.#fields = Object.freeze(fields);
    Object.freeze(this);
  }

  get name(): string {
    return this.#fields.name;
  }

  get avatar(): UnderScriptChatUser['avatar'] {
    return this.#fields.avatar;
  }

  get shinyAvatar(): boolean {
    return this.#fields.shinyAvatar;
  }

  get division(): string {
    return this.#fields.division;
  }

  get mainGroup(): UnderScriptChatGroup | undefined {
    return this.#fields.mainGroup;
  }

  get groups(): ReadonlyArray<UnderScriptChatGroup> {
    return this.#fields.groups;
  }

  get isMod(): boolean {
    return this.mainGroup !== undefined && isMod(this);
  }

  get isFriend(): boolean {
    return this.#presence.friend;
  }

  get isOnline(): boolean | undefined {
    return this.#presence.online;
  }

  get gameId(): number | undefined {
    return this.#presence.gameId;
  }

  toString(): string {
    return this.name;
  }

  get raw(): Raw {
    return this.#fields.raw;
  }
}

const users = new Map<string, ChatUser>();

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function parseGameId(value: unknown): number | undefined {
  return typeof value === 'number' && value >= 0 ? value : undefined;
}

function parseFields(value: Raw, name: string): UserFields {
  const { avatar, shinyAvatar, division, mainGroup, groups } = value;
  return {
    name,
    avatar: isRecord(avatar) && typeof avatar.image === 'string' ?
      { image: avatar.image, rarity: typeof avatar.rarity === 'string' ? avatar.rarity : '' } :
      undefined,
    shinyAvatar: shinyAvatar === true,
    division: typeof division === 'string' ? division : '',
    mainGroup: parseGroup(mainGroup),
    groups: Array.isArray(groups) ? groups.map(parseGroup).filter((group) => group !== undefined) : [],
    raw: value,
  };
}

function validId(value: unknown): value is UserId {
  return typeof value === 'number' || typeof value === 'string';
}

export function updateUser(value: unknown, { refresh = true }: { refresh?: boolean } = {}): ChatUser | undefined {
  if (!isRecord(value)) return undefined;
  const { id, username } = value;
  if (!validId(id) || typeof username !== 'string') return undefined;
  const key = `${id}`;
  const known = users.get(key);
  if (known) {
    if (refresh) {
      apply(known, parseFields(value, username));
      if ('gameId' in value) present(known, { gameId: parseGameId(value.gameId) });
    }
    return known;
  }
  const user = new ChatUser(id, parseFields(value, username));
  if ('gameId' in value) present(user, { gameId: parseGameId(value.gameId) });
  users.set(key, user);
  return user;
}

export function findUser(id: unknown): ChatUser | undefined {
  return validId(id) ? users.get(`${id}`) : undefined;
}

export function friendUsers(): ChatUser[] {
  return [...users.values()].filter((user) => user.isFriend);
}

export function findUserByName(name: string): ChatUser | undefined {
  const wanted = name.toLowerCase();
  return [...users.values()].find((user) => user.name.toLowerCase() === wanted);
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function syncFriends(value: unknown): void {
  const list = parseJson(value);
  if (!Array.isArray(list)) return;
  const friends = new Set<ChatUser>();
  list.forEach((entry: unknown) => {
    if (!isRecord(entry) || !validId(entry.id)) return;
    const { id, username, online, idGame } = entry;
    let user = users.get(`${id}`);
    if (!user && typeof username === 'string') {
      user = new ChatUser(id, parseFields(entry, username));
      users.set(`${id}`, user);
    }
    if (!user) return;
    friends.add(user);
    present(user, { friend: true, online: online === true, gameId: parseGameId(idGame) });
  });
  users.forEach((user) => {
    if (user.isFriend && !friends.has(user)) present(user, { friend: false, online: undefined });
  });
}

let selfKey: string | undefined;

export function syncSelf(value: unknown): void {
  const user = updateUser(parseJson(value));
  if (!user) return;
  selfKey = `${user.id}`;
  present(user, { online: true });
}

export function setSelfOnline(online: boolean): void {
  const user = selfKey === undefined ? undefined : users.get(selfKey);
  if (user) present(user, { online });
}
