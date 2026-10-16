const KEY = 'underscript.craft.dust';
const MAX_AGE = 30 * 60 * 1000;

type Stored = { user: string; dust: number; at: number };

type Options = {
  storage?: Storage;
  user?: string | null;
  now?: number;
};

export function currentUser(storage: Storage = sessionStorage): string | null {
  try {
    return storage.getItem('UserID');
  } catch {
    return null;
  }
}

export function saveDust(dust: number, {
  storage = sessionStorage,
  user = currentUser(storage),
  now = Date.now(),
}: Options = {}): boolean {
  if (!user) return false;
  try {
    storage.setItem(KEY, JSON.stringify({ user, dust, at: now } satisfies Stored));
    return true;
  } catch {
    return false;
  }
}

export function loadDust({
  storage = sessionStorage,
  user = currentUser(storage),
  now = Date.now(),
}: Options = {}): number | undefined {
  if (!user) return undefined;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return undefined;
    const stored: Partial<Stored> = JSON.parse(raw);
    if (stored.user !== user) return undefined;
    if (typeof stored.dust !== 'number' || !Number.isFinite(stored.dust)) return undefined;
    if (typeof stored.at !== 'number' || now - stored.at > MAX_AGE) return undefined;
    return stored.dust;
  } catch {
    return undefined;
  }
}
