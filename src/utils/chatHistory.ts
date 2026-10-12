type Message = {
  id: number | string;
  timestamp: number;
  user?: { id?: unknown };
  [key: string]: unknown;
};

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

type Options = {
  storage: Store;
  limit?: number;
  delay?: number;
  now?: () => number;
  schedule?: (callback: () => void, delay: number) => unknown;
};

export type ChatHistory = {
  add(room: string, message: Message): boolean;
  removeUser(userId: unknown): void;
  restore(): void;
  flush(): void;
};

const OWN_PREFIX = 'underscript.chat.public.';
const GAME_PREFIX = 'chat-public-room-';

function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) return false;
  const { id, timestamp } = value as Message;
  return (typeof id === 'number' || typeof id === 'string') && typeof timestamp === 'number';
}

function parse(raw: string | null): Message[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isMessage) : [];
  } catch {
    return [];
  }
}

export function createChatHistory({
  storage,
  limit = 50,
  delay = 1000,
  now = Date.now,
  schedule = setTimeout,
}: Options): ChatHistory {
  const rooms = new Map<string, Message[]>();
  const dirty = new Set<string>();
  let scheduled = false;

  function roomIds(): string[] {
    const ids: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(OWN_PREFIX)) ids.push(key.substring(OWN_PREFIX.length));
    }
    return ids;
  }

  function load(room: string): Message[] {
    let list = rooms.get(room);
    if (!list) {
      list = parse(storage.getItem(`${OWN_PREFIX}${room}`));
      rooms.set(room, list);
    }
    return list;
  }

  function write(room: string): void {
    const list = load(room);
    if (list.length) {
      storage.setItem(`${OWN_PREFIX}${room}`, JSON.stringify(list));
    } else {
      storage.removeItem(`${OWN_PREFIX}${room}`);
    }
  }

  function flush(): void {
    dirty.forEach(write);
    dirty.clear();
  }

  function queue(room: string): void {
    dirty.add(room);
    if (scheduled) return;
    scheduled = true;
    schedule(() => {
      scheduled = false;
      flush();
    }, delay);
  }

  return {
    add(room, message) {
      if (!isMessage(message)) return false;
      const list = load(room);
      if (list.some(({ id }) => id === message.id)) return false;
      list.push(message);
      if (list.length > limit) list.splice(0, list.length - limit);
      queue(room);
      return true;
    },

    removeUser(userId) {
      roomIds().forEach((room) => {
        const list = load(room);
        const kept = list.filter((message) => message.user?.id !== userId);
        if (kept.length === list.length) return;
        rooms.set(room, kept);
        dirty.delete(room);
        write(room);
      });
    },

    restore() {
      flush();
      const stamp = now();
      roomIds().forEach((room) => {
        const ours = load(room);
        if (!ours.length) return;
        const known = new Set(ours.map(({ id }) => id));
        const theirs = parse(storage.getItem(`${GAME_PREFIX}${room}`)).filter(({ id }) => !known.has(id));
        const merged = [...theirs, ...ours]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(-limit)
          .map((message) => ({ ...message, timestamp: stamp }));
        storage.setItem(`${GAME_PREFIX}${room}`, JSON.stringify(merged));
      });
    },

    flush,
  };
}
