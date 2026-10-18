import type { GameEvent } from './events';
import type { GameEventUnseen } from './events.unseen';

export type GameBypassAction =
  | 'getGameRemoved'
  | 'getError'
  | 'getGameError'
  | 'getShowMulligan'
  | 'getHideMulligan'
  | 'connect'
  | 'getEmote';

export type AnyGameEvent = GameEvent | GameEventUnseen;

export type GameBypassEvent = Extract<AnyGameEvent, { action: GameBypassAction }>;

export type GameQueuedEvent = Exclude<AnyGameEvent, { action: GameBypassAction }>;
