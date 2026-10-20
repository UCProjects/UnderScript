import eventEmitter from 'src/utils/eventEmitter';
import runQueue from 'src/utils/workQueue';
import type { QueueRun } from 'src/utils/workQueue';
import Item from 'src/structures/constants/item';
import { getCollection } from 'src/utils/user';
import VarStore from 'src/utils/VarStore';
import { attempt } from './request';
import type { PacksResponse, Refusal } from './request';
import * as display from './display';

type Card = { id: number; name: string; rarity: string; shiny: boolean };
type Owned = { id: number; shiny: boolean };

export type Run = {
  kind: 'buy' | 'open';
  type: string;
  gold: boolean;
  requested: number;
};

const BUY_TYPES: ReadonlyArray<string> = ['', 'DR', 'UTY'];
const OPEN_TYPES: ReadonlyArray<string> = ['', 'DR', 'UTY', 'Shiny', 'Super', 'Final'];
const OPEN_ITEMS = [Item.UT_PACK, Item.DR_PACK, Item.UTY_PACK, Item.SHINY_PACK, Item.SUPER_PACK, Item.FINAL_PACK];

const LATE_DELAY = 500;

const events = eventEmitter<UnderScriptPacksEvents>();
const active = new VarStore<Run | undefined>();
const late = {
  packs: 0,
  cards: [] as UnderScriptPackCard[],
  type: '' as UnderScriptOpenPackType,
  timer: undefined as ReturnType<typeof setTimeout> | undefined,
};

function count(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`Count(${value}) must be a whole number of at least 1`);
  }
  return value;
}

function openType(type: unknown): UnderScriptOpenPackType {
  if (type === undefined) return '';
  if (type instanceof Item) {
    const index = OPEN_ITEMS.indexOf(type);
    if (index === -1) throw new Error(`Unsupported Item: ${type}`);
    return OPEN_TYPES[index] as UnderScriptOpenPackType;
  }
  if (typeof type !== 'string' || !OPEN_TYPES.includes(type)) throw new Error(`Unsupported Pack: ${type}`);
  return type as UnderScriptOpenPackType;
}

function buyType(type: unknown): UnderScriptBuyPackType {
  if (type === undefined) return '';
  if (typeof type !== 'string' || !BUY_TYPES.includes(type)) throw new Error(`Unsupported Pack: ${type}`);
  return type as UnderScriptBuyPackType;
}

async function ownedCards(): Promise<Owned[]> {
  try {
    const collection: unknown = await getCollection();
    return Array.isArray(collection) ? collection.map(({ id, shiny }: Owned) => ({ id, shiny })) : [];
  } catch {
    return [];
  }
}

function parseCards(data: PacksResponse): Card[] {
  try {
    const cards: unknown = JSON.parse(data.cards ?? '[]');
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

type Outcome = { done: number; stopped: boolean; error?: string };

async function execute<T>(
  run: Run,
  action: string,
  expected: string,
  onOk: (data: PacksResponse, closed: boolean) => T,
): Promise<{ outcome: Outcome; values: T[] }> {
  if (active.value) throw new Error('Packs are already being bought or opened');
  active.value = run;
  const values: T[] = [];
  const refusal = new VarStore<string | undefined>();
  const queue = new VarStore<QueueRun | undefined>();
  const closed = new VarStore(false);
  const stop = () => queue.value?.stop();
  try {
    display.start(run, stop);
    queue.value = runQueue<number, PacksResponse | Refusal>({
      items: Array.from({ length: run.requested }, (_, index) => index),
      async attempt() {
        if (refusal.value !== undefined) return { type: 'skip' };
        const result = await attempt(action, expected);
        if (result.type !== 'ok' || !('refused' in result.value)) return result as never;
        refusal.value = result.value.refused;
        events.emit('rejected', { action, message: refusal.value });
        stop();
        return { type: 'skip' };
      },
      onOk(_, value) {
        const data = value as PacksResponse;
        display.apply(action, data);
        values.push(onOk(data, closed.value));
      },
      onChange: (state) => display.progress(run, state),
    });
    const result = await queue.value.promise;
    closed.value = true;
    const error = refusal.value;
    return { outcome: { done: result.done, stopped: result.stopped && error === undefined, error }, values };
  } finally {
    active.value = undefined;
    display.end();
  }
}

function isCancelable(name: 'bought' | 'opened', result: UnderScriptPacksBought | UnderScriptPacksOpened): boolean {
  return (events.emit({ cancelable: true }, name, result as never) as UnderScriptEmitResult).canceled;
}

export function checkBuy(amount: unknown, options: UnderScriptPacksBuyOptions = {}) {
  return { requested: count(amount), type: buyType(options.type), gold: options.gold !== false };
}

export function checkOpen(amount: unknown, packType?: unknown) {
  return { requested: count(amount), type: openType(packType) };
}

async function buy(amount: unknown, options: UnderScriptPacksBuyOptions = {}): Promise<UnderScriptPacksBought> {
  const { requested, type, gold } = checkBuy(amount, options);
  const run: Run = { kind: 'buy', type, gold, requested };
  const { outcome } = await execute(run, `add${type}Pack${gold ? '' : 'Ucp'}`, 'getPackAdded', () => 1);
  const result: UnderScriptPacksBought = {
    count: outcome.done,
    requested,
    type,
    gold,
    stopped: outcome.stopped,
    ...(outcome.error === undefined ? {} : { error: outcome.error }),
  };
  if (!isCancelable('bought', result) && (result.count || result.error !== undefined)) display.bought(result);
  return result;
}

function flushLate(): void {
  const { packs: amount, cards, type } = late;
  late.packs = 0;
  late.cards = [];
  late.timer = undefined;
  if (!amount) return;
  const result: UnderScriptPacksOpened = {
    count: amount,
    requested: amount,
    type,
    cards: Object.freeze(cards),
    stopped: false,
    late: true,
  };
  if (!isCancelable('opened', result)) display.opened(result);
}

function collectLate(type: UnderScriptOpenPackType, cards: UnderScriptPackCard[]): void {
  if (late.packs && late.type !== type) {
    clearTimeout(late.timer);
    flushLate();
  }
  late.type = type;
  late.packs += 1;
  late.cards.push(...cards);
  clearTimeout(late.timer);
  late.timer = setTimeout(flushLate, LATE_DELAY);
}

async function open(amount: unknown, packType?: unknown): Promise<UnderScriptPacksOpened> {
  const { requested, type } = checkOpen(amount, packType);
  const run: Run = { kind: 'open', type, gold: true, requested };
  const owned = await ownedCards();
  const cards: UnderScriptPackCard[] = [];
  const { outcome } = await execute(run, `open${type}Pack`, 'getCards', (data, closed) => {
    const opened = parseCards(data).map((card): UnderScriptPackCard => {
      const isNew = !owned.some(({ id, shiny }) => id === card.id && shiny === card.shiny);
      if (isNew) owned.push({ id: card.id, shiny: card.shiny });
      return Object.freeze({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        shiny: !!card.shiny,
        new: isNew,
      });
    });
    if (closed) collectLate(type, opened);
    else cards.push(...opened);
  });
  const result: UnderScriptPacksOpened = {
    count: outcome.done,
    requested,
    type,
    cards: Object.freeze([...cards]),
    stopped: outcome.stopped,
    late: false,
    ...(outcome.error === undefined ? {} : { error: outcome.error }),
  };
  if (!isCancelable('opened', result) && (result.count || result.error !== undefined)) display.opened(result);
  return result;
}

const packs: UnderScriptPacksPlugin = {
  get buying() {
    return active.value?.kind === 'buy';
  },
  get opening() {
    return active.value?.kind === 'open';
  },
  on(event, listener) {
    events.on(event, listener);
    return packs;
  },
  once(event, listener) {
    events.once(event, listener);
    return packs;
  },
  off(event, listener) {
    events.off(event, listener);
    return packs;
  },
  buy,
  open,
};

export default packs;
