import * as api from 'src/utils/4.api';
import { cardName } from 'src/utils/cardHelper';
import eventEmitter from 'src/utils/eventEmitter';
import { global } from 'src/utils/global';
import { loadDust, saveDust } from './dustStore';
import { post } from './request';
import type { CraftBody } from './request';
import { isAction, parseAuto, parseCard, parseRejection } from './result';

type Raw = Record<string, unknown>;
type Card = Parameters<typeof cardName>[0];

type Hooks = {
  apply?(action: UnderScriptCraftAction, response: unknown, body: CraftBody): void;
  liveDust?(): number | undefined;
};

type Results = {
  craft: UnderScriptCraftResult;
  disenchant: UnderScriptCraftResult;
  auto: UnderScriptAutoDisenchant;
};

const events = eventEmitter<UnderScriptCraftEvents>();
let hooks: Hooks = {};
let tail: Promise<unknown> = Promise.resolve();
let knownDust: number | undefined;

function nameOf(card: Raw): string | undefined {
  return cardName(card as Card);
}

function translate(message: string): unknown {
  return global('translateFromServerJson', { throws: false })?.(message);
}

export function rememberDust(dust: number): void {
  if (!Number.isFinite(dust)) return;
  knownDust = dust;
  saveDust(dust);
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const next = tail.then(task, task);
  tail = next.catch(() => {});
  return next;
}

function announce<A extends UnderScriptCraftAction>(
  action: A,
  response: unknown,
  data: unknown,
): Results[A] | undefined {
  if (action === 'auto') {
    const auto = parseAuto(response);
    if (auto) {
      rememberDust(auto.dust);
      events.emit('autoDisenchanted', auto);
    }
    return auto as Results[A] | undefined;
  }
  const card = parseCard(response, data, nameOf);
  if (card) {
    rememberDust(card.dust);
    events.emit(action === 'craft' ? 'crafted' : 'disenchanted', card);
  }
  return card as Results[A] | undefined;
}

async function run<A extends UnderScriptCraftAction>(body: CraftBody & { action: A }): Promise<Results[A]> {
  const outcome = await enqueue(() => post(body));
  switch (outcome.type) {
    case 'ok': {
      const { data } = outcome.response;
      hooks.apply?.(body.action, data, body);
      const result = announce(body.action, data, body);
      if (!result) throw new Error('Unexpected response');
      return result;
    }
    case 'refused': {
      const rejection = parseRejection(body.action, outcome.data, translate);
      events.emit('rejected', rejection);
      throw new Error(rejection.message || rejection.status);
    }
    case 'limited':
      throw new Error('Rate limited');
    default:
      throw new Error('Request failed');
  }
}

function toBody<A extends 'craft' | 'disenchant'>(
  action: A,
  id: number | string,
  options?: UnderScriptCraftOptions,
): CraftBody & { action: A } {
  const idCard = Number(id);
  if (!Number.isInteger(idCard)) throw new Error('A card id is required');
  return { action, idCard, isShiny: options?.shiny === true };
}

const craft: UnderScriptCraftPlugin = {
  get dust() {
    return hooks.liveDust?.() ?? knownDust ?? loadDust();
  },
  on(event, listener) {
    events.on(event, listener);
    return craft;
  },
  once(event, listener) {
    events.once(event, listener);
    return craft;
  },
  off(event, listener) {
    events.off(event, listener);
    return craft;
  },
  async craft(id, options) {
    return run(toBody('craft', id, options));
  },
  async disenchant(id, options) {
    return run(toBody('disenchant', id, options));
  },
  async autoDisenchant() {
    return run({ action: 'auto' });
  },
};

export function attach(next: Partial<Hooks>): void {
  hooks = { ...hooks, ...next };
}

export function report(action: unknown, success: boolean, response: unknown, data: unknown): void {
  if (!isAction(action)) return;
  if (success) {
    announce(action, response, data);
  } else {
    events.emit('rejected', parseRejection(action, response, translate));
  }
}

export function reportSmartDisenchant(summary: UnderScriptSmartDisenchant): void {
  rememberDust(summary.dust);
  events.emit('smartDisenchanted', summary);
}

Object.defineProperty(api.mod.craft, 'dust', {
  enumerable: true,
  get: () => craft.dust,
});

export default craft;
