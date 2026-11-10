import GameState from './state';

export type {
  GameCardState,
  GameDerivedEvents,
  GameEndReason,
  GameFrameEvents,
  GamePlayerState,
  GameResult,
  GameResultFrame,
  GameSlotState,
  GameStateEvents,
} from './state';

const game = new GameState();

export const emit = game.emit;

export default game;
