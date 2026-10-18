import axios from 'axios';
import eventEmitter from 'src/utils/eventEmitter';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import { getSaved, listSaved } from './saved';
import type { SavedDeck } from './saved';

type Raw = Record<string, unknown>;
type Id = number | string;

export type CurrentDeck = {
  readonly soul: string;
  readonly cards: ReadonlyArray<{ readonly id: Id; readonly shiny: boolean }>;
  readonly artifacts: ReadonlyArray<Id>;
};

export type DeckChange = {
  readonly soul: string | undefined;
  readonly action: string;
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
};

export function emit<K extends keyof DecksEvents>(event: K, ...args: DecksEvents[K]): void {
  events.emit(event, ...args);
}

export default decks;
