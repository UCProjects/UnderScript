import { global } from 'src/utils/global';

type Raw = Record<string, unknown>;
type Id = number | string;

export type SavedCard = { readonly id: Id; readonly shiny: boolean };
export type PluginMeta = Record<string, unknown>;

const DECK_PREFIX = 'underscript.deck';
const META_PREFIX = 'underscript.deckmeta';
const PLUGIN_SEGMENT = 'plugin.';
const SLOT_PATTERN = /^([^.]+)\.(\d+)$/;

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is Id {
  return typeof value === 'number' || typeof value === 'string';
}

function userId(): string | undefined {
  const id: unknown = global('selfId', { throws: false });
  return isId(id) ? `${id}` : undefined;
}

function readJson(key: string): unknown {
  const text = localStorage.getItem(key);
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function keysWith(prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

function readText(key: string | undefined): string | undefined {
  const text = key === undefined ? null : localStorage.getItem(key);
  return text === null || text === '' ? undefined : text;
}

function writeText(key: string | undefined, value: string | undefined): void {
  if (key === undefined) throw new Error('Not logged in');
  if (value === undefined || value === '') {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, `${value}`);
  }
}

export class SavedDeck {
  readonly soul: string;
  readonly index: number;

  constructor(soul: string, index: number) {
    this.soul = soul;
    this.index = index;
    Object.freeze(this);
  }

  get #slot(): string | undefined {
    const user = userId();
    return user === undefined ? undefined : `${user}.${this.soul}.${this.index}`;
  }

  get #deckKey(): string | undefined {
    const slot = this.#slot;
    return slot === undefined ? undefined : `${DECK_PREFIX}.${slot}`;
  }

  get #metaKey(): string | undefined {
    const slot = this.#slot;
    return slot === undefined ? undefined : `${META_PREFIX}.${slot}`;
  }

  get #body(): Raw | unknown[] | undefined {
    const key = this.#deckKey;
    const data = key === undefined ? undefined : readJson(key);
    return Array.isArray(data) || isRecord(data) ? data : undefined;
  }

  get exists(): boolean {
    return this.#body !== undefined;
  }

  get cards(): SavedCard[] {
    const body = this.#body;
    const list = Array.isArray(body) ? body : body?.cards;
    if (!Array.isArray(list)) return [];
    return list
      .filter((card): card is Raw => isRecord(card) && isId(card.id))
      .map((card) => ({ id: card.id as Id, shiny: card.shiny === true }));
  }

  get artifacts(): Id[] {
    const body = this.#body;
    const list = Array.isArray(body) ? undefined : body?.artifacts;
    return Array.isArray(list) ? list.filter(isId) : [];
  }

  get name(): string | undefined {
    return readText(this.#deckKey && `${this.#deckKey}.name`);
  }

  set name(value: string | undefined) {
    writeText(this.#deckKey && `${this.#deckKey}.name`, value);
  }

  get description(): string | undefined {
    return readText(this.#metaKey && `${this.#metaKey}.description`);
  }

  set description(value: string | undefined) {
    writeText(this.#metaKey && `${this.#metaKey}.description`, value);
  }

  allMeta(): Record<string, PluginMeta> {
    const base = this.#metaKey;
    const all: Record<string, PluginMeta> = {};
    if (base === undefined) return all;
    const prefix = `${base}.${PLUGIN_SEGMENT}`;
    keysWith(prefix).forEach((key) => {
      const data = readJson(key);
      if (isRecord(data)) all[key.slice(prefix.length)] = data;
    });
    return all;
  }

  metaOf(plugin: string): PluginMeta {
    const base = this.#metaKey;
    const data = base === undefined ? undefined : readJson(`${base}.${PLUGIN_SEGMENT}${plugin}`);
    return isRecord(data) ? data : {};
  }

  getMeta(plugin: string, key: string): unknown {
    return this.metaOf(plugin)[key];
  }

  setMeta(plugin: string, key: string, value: unknown): void {
    const base = this.#metaKey;
    if (base === undefined) throw new Error('Not logged in');
    if (typeof key !== 'string' || !key) throw new Error('Key must be provided');
    if (JSON.stringify(value) === undefined) throw new Error('Meta values must be JSON');
    const text = JSON.stringify({ ...this.metaOf(plugin), [key]: value });
    localStorage.setItem(`${base}.${PLUGIN_SEGMENT}${plugin}`, text);
  }

  removeMeta(plugin: string, key: string): void {
    const base = this.#metaKey;
    if (base === undefined) return;
    const meta = this.metaOf(plugin);
    if (!(key in meta)) return;
    delete meta[key];
    const storageKey = `${base}.${PLUGIN_SEGMENT}${plugin}`;
    if (Object.keys(meta).length) {
      localStorage.setItem(storageKey, JSON.stringify(meta));
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  write(cards: ReadonlyArray<SavedCard>, artifacts: ReadonlyArray<Id>): void {
    const key = this.#deckKey;
    if (key === undefined) throw new Error('Not logged in');
    localStorage.setItem(key, JSON.stringify({
      cards: cards.map(({ id, shiny }) => (shiny ? { id, shiny: true } : { id })),
      artifacts: [...artifacts],
    }));
  }

  erase(): void {
    const deck = this.#deckKey;
    const meta = this.#metaKey;
    if (deck !== undefined) {
      localStorage.removeItem(deck);
      localStorage.removeItem(`${deck}.name`);
    }
    if (meta !== undefined) {
      keysWith(`${meta}.`).forEach((key) => localStorage.removeItem(key));
    }
  }
}

const cache = new Map<string, SavedDeck>();

export function getSaved(soul: string, index: number): SavedDeck {
  const key = `${soul}.${index}`;
  let deck = cache.get(key);
  if (!deck) {
    deck = new SavedDeck(soul, index);
    cache.set(key, deck);
  }
  return deck;
}

export function listSaved(soul?: string): SavedDeck[] {
  const user = userId();
  if (user === undefined) return [];
  const prefix = `${DECK_PREFIX}.${user}.`;
  const decks: SavedDeck[] = [];
  keysWith(prefix).forEach((key) => {
    const match = SLOT_PATTERN.exec(key.slice(prefix.length));
    if (!match || (soul !== undefined && match[1] !== soul)) return;
    const deck = getSaved(match[1], Number(match[2]));
    if (deck.exists) decks.push(deck);
  });
  return decks.sort((a, b) => a.soul.localeCompare(b.soul) || a.index - b.index);
}
