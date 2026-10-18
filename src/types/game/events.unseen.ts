import type { GameCard, GameSoul } from './entities';
import type { JsonString } from './wire';

export type GameEventsUnseen = {
  getEmote: {
    idUser: unknown;
    emoteImage: unknown;
  };
  getError: {
    message: unknown;
  };
  getFakeDeath: {
    waitTime: number;
    idMonster: unknown;
  };
  getGameError: {
    message: unknown;
  };
  getGameRemoved: Record<never, never>;
  getResult: {
    winner: unknown;
    looser: unknown;
    cause: unknown;
  };
  getShowCard: {
    waitTime: number;
    card: JsonString<GameCard>;
  };
  getTurn: {
    turn: unknown;
  };
  getUpdateSoul: {
    idPlayer: unknown;
    soul: JsonString<GameSoul>;
  };
};

export type GameEventUnseen = {
  [A in keyof GameEventsUnseen]: { action: A } & GameEventsUnseen[A];
}[keyof GameEventsUnseen];
