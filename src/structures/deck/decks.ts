import axios from 'axios';
import eventEmitter from 'src/utils/eventEmitter';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import { getSaved, listSaved } from './saved';
import type { SavedDeck } from './saved';
import * as writes from './write';
import type { DeckEdit, DeckTarget } from './write';

type Raw = Record<string, unknown>;
type Id = number | string;
type CardOptions = { shiny?: boolean };

export type CurrentDeck = {
  readonly soul: string;
  readonly cards: ReadonlyArray<{ readonly id: Id; readonly shiny: boolean }>;
  readonly artifacts: ReadonlyArray<Id>;
};

export type DeckChange = {
  readonly soul: string | undefined;
  readonly action: string;
  readonly id?: Id;
  readonly shiny?: boolean;
};

export type DecksEvents = {
  changed: [change: DeckChange];
};

const events = eventEmitter<DecksEvents>();

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is Id {
  return typeof value === 'number' || typeof value === 'string';
}

function idOf(value: unknown): Id | undefined {
  if (isRecord(value)) return isId(value.id) ? value.id : undefined;
  return isId(value) ? value : undefined;
}

function toDeck(soul: string, cards: unknown, artifacts: unknown): CurrentDeck {
  return {
    soul,
    cards: (Array.isArray(cards) ? cards : [])
      .filter((card): card is Raw => isRecord(card) && isId(card.id))
      .map((card) => ({ id: card.id as Id, shiny: card.shiny === true })),
    artifacts: (Array.isArray(artifacts) ? artifacts : [])
      .map(idOf)
      .filter((id) => id !== undefined),
  };
}

function fromPage(): Record<string, CurrentDeck> {
  const cards: unknown = global('decks', { throws: false });
  const artifacts: unknown = global('decksArtifacts', { throws: false });
  const result: Record<string, CurrentDeck> = {};
  if (!isRecord(cards)) return result;
  Object.keys(cards).forEach((soul) => {
    result[soul] = toDeck(soul, cards[soul], isRecord(artifacts) ? artifacts[soul] : undefined);
  });
  return result;
}

function parse(value: unknown): unknown {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

function fromConfig(config: unknown): Record<string, CurrentDeck> {
  const result: Record<string, CurrentDeck> = {};
  const list = isRecord(config) ? parse(config.decks) : undefined;
  if (!Array.isArray(list)) return result;
  list.forEach((deck: unknown) => {
    if (!isRecord(deck) || !isRecord(deck.soul) || typeof deck.soul.name !== 'string') return;
    result[deck.soul.name] = toDeck(deck.soul.name, deck.cardsList, deck.artifacts);
  });
  return result;
}

async function current(): Promise<Record<string, CurrentDeck>> {
  if (onPage('Decks')) {
    const page = fromPage();
    if (Object.keys(page).length) return page;
  }
  const { data } = await axios.get<unknown>('DecksConfig', { params: { time: Date.now() } });
  return fromConfig(data);
}

writes.attach({ announce: (edit) => events.emit('changed', edit) });

async function currentFor(soul: string): Promise<CurrentDeck | undefined> {
  return (await current())[soul];
}

async function save(soul: string, slot: number): Promise<SavedDeck> {
  if (typeof soul !== 'string' || !soul) throw new Error('A soul is required');
  if (!Number.isInteger(slot) || slot < 0) throw new Error('A slot is required');
  const deck = await currentFor(soul);
  if (!deck) throw new Error(`Unknown soul: ${soul}`);
  if (!deck.cards.length && !deck.artifacts.length) throw new Error('Nothing to save');
  const saved = getSaved(soul, slot);
  saved.write(deck.cards, deck.artifacts);
  return saved;
}

const decks = {
  on: events.on,
  once: events.once,
  off: events.off,
  saved: (soul?: string): SavedDeck[] => listSaved(soul),
  get: (soul: string, index: number): SavedDeck | undefined => {
    if (typeof soul !== 'string' || !soul || !Number.isInteger(index) || index < 0) return undefined;
    const deck = getSaved(soul, index);
    return deck.exists ? deck : undefined;
  },
  current,
  save,
  addCard: (soul: string, id: Id, options?: CardOptions): Promise<DeckEdit> => writes.addCard(soul, id, options),
  removeCard: (soul: string, id: Id, options?: CardOptions): Promise<DeckEdit> => writes.removeCard(soul, id, options),
  addArtifact: (soul: string, id: Id): Promise<DeckEdit> => writes.addArtifact(soul, id),
  clear: (soul: string): Promise<DeckEdit> => writes.clear(soul),
  clearArtifacts: (soul: string): Promise<DeckEdit> => writes.clearArtifacts(soul),
  load: (soul: string, target: DeckTarget): Promise<DeckEdit[]> => writes.load(soul, target, () => currentFor(soul)),
};

export function emit<K extends keyof DecksEvents>(event: K, ...args: DecksEvents[K]): void {
  events.emit(event, ...args);
}

export default decks;
