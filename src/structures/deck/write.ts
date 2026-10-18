import { global } from 'src/utils/global';
import { post } from './request';
import type { DeckBody } from './request';

type Raw = Record<string, unknown>;
type Id = number | string;

export type DeckEdit = {
  readonly soul: string;
  readonly action: DeckBody['action'];
  readonly id?: Id;
  readonly shiny?: boolean;
};

type Hooks = {
  apply?(body: DeckBody, data: Raw): void;
  announce?(edit: DeckEdit): void;
};

export type DeckTarget = {
  readonly cards: ReadonlyArray<{ readonly id: Id; readonly shiny?: boolean }>;
  readonly artifacts?: ReadonlyArray<Id>;
};

export type Current = {
  readonly cards: ReadonlyArray<{ readonly id: Id; readonly shiny: boolean }>;
  readonly artifacts: ReadonlyArray<Id>;
};

export const MAX_CARDS = 25;
export const MAX_ARTIFACTS = 2;
const CLEAR_ALL_AT = 13;

let hooks: Hooks = {};
let tail: Promise<unknown> = Promise.resolve();

export function attach(next: Hooks): void {
  hooks = { ...hooks, ...next };
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = tail.then(task, task);
  tail = next.catch(() => {});
  return next;
}

function translate(message: unknown): string {
  if (typeof message !== 'string') return '';
  try {
    const translated: unknown = global('translateFromServerJson', { throws: false })?.(message);
    return typeof translated === 'string' && translated ? translated : message;
  } catch {
    return message;
  }
}

function editOf(body: DeckBody): DeckEdit {
  switch (body.action) {
    case 'addCard':
    case 'removeCard':
      return { soul: body.soul, action: body.action, id: body.idCard, shiny: body.isShiny };
    case 'addArtifact':
      return { soul: body.soul, action: body.action, id: body.idArtifact };
    default:
      return { soul: body.soul, action: body.action };
  }
}

async function run(body: DeckBody): Promise<DeckEdit> {
  const outcome = await enqueue(() => post(body));
  switch (outcome.type) {
    case 'ok': {
      hooks.apply?.(body, outcome.data);
      const edit = editOf(body);
      hooks.announce?.(edit);
      return edit;
    }
    case 'refused':
      throw new Error(translate(outcome.data.message) || 'The server refused the change');
    case 'empty':
      throw new Error('The server sent an empty reply');
    case 'limited':
      throw new Error('Rate limited');
    default:
      throw new Error('Request failed');
  }
}

function toSoul(soul: unknown): string {
  if (typeof soul !== 'string' || !soul) throw new Error('A soul is required');
  return soul;
}

function toId(id: unknown, what: string): number {
  const value = Number(id);
  if (id === '' || id === null || typeof id === 'boolean' || !Number.isInteger(value)) {
    throw new Error(`${what} is required`);
  }
  return value;
}

export async function addCard(soul: string, id: Id, options?: { shiny?: boolean }): Promise<DeckEdit> {
  const idCard = toId(id, 'A card id');
  return run({ action: 'addCard', idCard, isShiny: options?.shiny === true, soul: toSoul(soul) });
}

export async function removeCard(soul: string, id: Id, options?: { shiny?: boolean }): Promise<DeckEdit> {
  const idCard = toId(id, 'A card id');
  return run({ action: 'removeCard', idCard, isShiny: options?.shiny === true, soul: toSoul(soul) });
}

export async function addArtifact(soul: string, id: Id): Promise<DeckEdit> {
  return run({ action: 'addArtifact', idArtifact: toId(id, 'An artifact id'), soul: toSoul(soul) });
}

export async function clear(soul: string): Promise<DeckEdit> {
  return run({ action: 'removeAllCards', soul: toSoul(soul) });
}

export async function clearArtifacts(soul: string): Promise<DeckEdit> {
  return run({ action: 'clearArtifacts', soul: toSoul(soul) });
}

type Step =
  | { action: 'clear' }
  | { action: 'clearArtifacts' }
  | { action: 'removeCard' | 'addCard'; id: number; shiny: boolean }
  | { action: 'addArtifact'; id: number };

function cardKey({ id, shiny }: { id: Id; shiny?: boolean }): string {
  return `${Number(id)}:${shiny === true}`;
}

export function plan(now: Current, target: DeckTarget): Step[] {
  const wanted = new Map<string, number>();
  target.cards.forEach((card) => wanted.set(cardKey(card), (wanted.get(cardKey(card)) ?? 0) + 1));
  const removals: Step[] = [];
  const kept = new Map<string, number>();
  now.cards.forEach((card) => {
    const key = cardKey(card);
    const used = kept.get(key) ?? 0;
    if (used < (wanted.get(key) ?? 0)) {
      kept.set(key, used + 1);
    } else {
      removals.push({ action: 'removeCard', id: Number(card.id), shiny: card.shiny });
    }
  });
  const additions: Step[] = [];
  const left = new Map(kept);
  target.cards.forEach((card) => {
    const key = cardKey(card);
    const used = left.get(key) ?? 0;
    if (used > 0) {
      left.set(key, used - 1);
    } else {
      additions.push({ action: 'addCard', id: Number(card.id), shiny: card.shiny === true });
    }
  });

  const artifacts = (target.artifacts ?? []).map(Number);
  const currentArtifacts = now.artifacts.map(Number);
  const wipe = removals.length > CLEAR_ALL_AT || (removals.length > 0 && removals.length === now.cards.length);
  const steps: Step[] = [];
  if (wipe) {
    steps.push({ action: 'clear' });
    target.cards.forEach((card) => steps.push({ action: 'addCard', id: Number(card.id), shiny: card.shiny === true }));
    artifacts.forEach((id) => steps.push({ action: 'addArtifact', id }));
    return steps;
  }
  steps.push(...removals, ...additions);
  const stale = currentArtifacts.some((id) => !artifacts.includes(id));
  if (stale) {
    steps.push({ action: 'clearArtifacts' });
    artifacts.forEach((id) => steps.push({ action: 'addArtifact', id }));
  } else {
    artifacts.filter((id) => !currentArtifacts.includes(id)).forEach((id) => steps.push({ action: 'addArtifact', id }));
  }
  return steps;
}

function perform(soul: string, step: Step): Promise<DeckEdit> {
  switch (step.action) {
    case 'clear':
      return clear(soul);
    case 'clearArtifacts':
      return clearArtifacts(soul);
    case 'addArtifact':
      return addArtifact(soul, step.id);
    case 'addCard':
      return addCard(soul, step.id, { shiny: step.shiny });
    default:
      return removeCard(soul, step.id, { shiny: step.shiny });
  }
}

export async function load(
  soul: string,
  target: DeckTarget,
  read: () => Promise<Current | undefined>,
): Promise<DeckEdit[]> {
  const name = toSoul(soul);
  if (!target || !Array.isArray(target.cards)) throw new Error('A list of cards is required');
  if (target.cards.length > MAX_CARDS) throw new Error(`A deck holds at most ${MAX_CARDS} cards`);
  if ((target.artifacts?.length ?? 0) > MAX_ARTIFACTS) {
    throw new Error(`A deck holds at most ${MAX_ARTIFACTS} artifacts`);
  }
  target.cards.forEach((card) => toId(card?.id, 'A card id'));
  target.artifacts?.forEach((id) => toId(id, 'An artifact id'));
  const now = await read();
  if (!now) throw new Error(`Unknown soul: ${name}`);
  return plan(now, target).reduce(
    (done, step) => done.then(async (edits) => [...edits, await perform(name, step)]),
    Promise.resolve<DeckEdit[]>([]),
  );
}
