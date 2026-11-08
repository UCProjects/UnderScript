import GameState from './state';
import type { GameStateEvents } from './state';

export type {
  GameCardState,
  GameEndReason,
  GamePlayerState,
  GameResult,
  GameResultFrame,
  GameSlotState,
  GameStateEvents,
} from './state';

const game = new GameState();

export function emit<K extends keyof GameStateEvents>(event: K, ...args: GameStateEvents[K]): void {
  game.emit(event, ...args);
}

export default game;
