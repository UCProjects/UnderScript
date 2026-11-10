import eventEmitter from 'src/utils/eventEmitter';
import eventManager from 'src/utils/eventManager';
import { translateText } from 'src/utils/translate';
import type { GameCard, GamePlayer, GameSlot } from 'src/types/game/entities';
import type { GameEvent, GameEvents } from 'src/types/game/events';
import type { GameEventUnseen, GameEventsUnseen } from 'src/types/game/events.unseen';
import type { Parsed } from 'src/types/game/wire';

export type GameCardState = Parsed<GameCard>;
export type GameSlotState = Parsed<GameSlot>;

export type GameResultFrame =
  | ({ action: 'getVictory' } & GameEvents['getVictory'])
  | ({ action: 'getDefeat' } & GameEvents['getDefeat'])
  | ({ action: 'getResult' } & GameEventsUnseen['getResult']);

export type GamePlayerState = {
  readonly id: number;
  readonly username: string;
  readonly soul: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly gold: number;
  readonly handSize: number;
  readonly deckSize: number;
};

export type GameEndReason = {
  readonly key: string;
  readonly text: string;
};

export type GameResult = {
  readonly winner: Readonly<GamePlayerState> | undefined;
  readonly loser: Readonly<GamePlayerState> | undefined;
  readonly won: boolean | undefined;
  readonly reason: GameEndReason | undefined;
  readonly data: GameResultFrame;
};

type GameFrames = GameEvents & GameEventsUnseen;

export type GameFrameEvents = {
  [K in keyof GameFrames]: [data: { action: K } & GameFrames[K]];
};

export type GameDerivedEvents = {
  ':playing': [];
  'player:endTurn': [];
  started: [];
  turn: [turn: number, mine: boolean];
  played: [card: GameCardState, mine: boolean];
  died: [card: GameCardState];
  finished: [result: GameResult];
};

export type GameStateEvents = GameDerivedEvents & GameFrameEvents;

const REASON_FALLBACKS: Record<string, string> = {
  'game-end-lethal': 'Lethal',
  'game-end-surrender': 'Surrender',
  'game-end-disconnection': 'Disconnection',
};

function reasonOf(key: unknown): GameEndReason | undefined {
  if (typeof key !== 'string' || !key) return undefined;
  return { key, text: translateText(key, { fallback: REASON_FALLBACKS[key] ?? key }) };
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Targets = Parsed<GameEvents['getPlayableCards']>;
type Frame<K extends GameEvent['action']> = Extract<GameEvent, { action: K }>;
type Handlers = { [K in GameEvent['action']]?: (data: Frame<K>) => void };

function unwrap<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') return JSON.parse(value) as T;
  return (value ?? fallback) as T;
}

function playerOf(value: unknown): Mutable<GamePlayerState> | undefined {
  const player = unwrap<Parsed<GamePlayer> | undefined>(value, undefined);
  if (!player) return undefined;
  return {
    id: player.id,
    username: player.username.startsWith('story-') ? translateText(player.username) : player.username,
    soul: player.soul?.name,
    hp: player.hp,
    maxHp: player.maxHp,
    gold: player.golds ?? 0,
    handSize: 0,
    deckSize: 0,
  };
}

export default class GameState {
  private readonly events = eventEmitter<GameStateEvents>();

  private self: Mutable<GamePlayerState> | undefined;

  private other: Mutable<GamePlayerState> | undefined;

  private cards: GameCardState[] = [];

  private held: GameCardState[] = [];

  private slotList = new Map<number, GameSlotState>();

  private targets: Targets = {
    playableCards: [],
    playableNoTargets: [],
    playableTriggers: [],
    availableAttackTargets: {},
  };

  private current: { id: number; type: string } | undefined;

  private turnNumber = 0;

  private turnOwner: number | undefined;

  private outcome: GameResult | undefined;

  private readonly handlers: Handlers = {
    connect: (data) => this.connect(data),
    getTurnStart: (data) => this.turnStart(data),
    getUpdateHand: (data) => { this.held = unwrap(data.hand, []); },
    getShowMulligan: (data) => { this.held = unwrap(data.hand, []); },
    getUpdateBoard: (data) => { this.cards = unwrap(data.board, []); },
    getUpdateSlot: (data) => this.updateSlot(unwrap(data.slot, undefined)),
    getPlayableCards: (data) => { this.targets = this.targetsOf(data); },
    getPlayersStats: (data) => this.stats(data),
    getUpdatePlayerHp: (data) => this.hp(data),
    getMonsterPlayed: (data) => this.played(unwrap(data.card, undefined), data.idPlayer, data.x),
    getSpellPlayed: (data) => this.played(unwrap(data.card, undefined), data.idPlayer),
    getMonsterDestroyed: (data) => this.destroyed(data.monsterId),
    updateCard: (data) => this.updateCard(unwrap(data.card, undefined)),
    getVictory: (data) => this.finish(data),
    getDefeat: (data) => this.finish(data),
    getResult: (data: GameResultFrame) => this.finish(data),
  } as Handlers;

  constructor() {
    eventManager.on('PlayingGame', () => this.emit({ singleton: true }, ':playing'));
  }

  readonly on = this.events.on;

  readonly once = this.events.once;

  readonly off = this.events.off;

  readonly emit = this.events.emit;

  get active(): boolean {
    return this.current !== undefined && this.outcome === undefined;
  }

  get id(): number | undefined {
    return this.current?.id;
  }

  get type(): string | undefined {
    return this.current?.type;
  }

  get turn(): number {
    return this.turnNumber;
  }

  get myTurn(): boolean {
    return this.turnOwner !== undefined && this.turnOwner === this.self?.id;
  }

  get result(): GameResult | undefined {
    return this.outcome;
  }

  get player(): Readonly<GamePlayerState> | undefined {
    return this.self;
  }

  get opponent(): Readonly<GamePlayerState> | undefined {
    return this.other;
  }

  get hand(): ReadonlyArray<GameCardState> {
    return this.held;
  }

  get board(): ReadonlyArray<GameCardState> {
    return this.cards;
  }

  get slots(): ReadonlyArray<GameSlotState> {
    return [...this.slotList.values()];
  }

  get playable(): Readonly<Targets> {
    return this.targets;
  }

  apply(data: GameEvent | GameEventUnseen): void {
    const handler = this.handlers[data.action as GameEvent['action']] as ((frame: unknown) => void) | undefined;
    handler?.call(this, data);
    (this.emit as (event: string, frame: unknown) => unknown)(data.action, data);
  }

  reset(): void {
    this.self = undefined;
    this.other = undefined;
    this.cards = [];
    this.held = [];
    this.slotList.clear();
    this.current = undefined;
    this.turnNumber = 0;
    this.turnOwner = undefined;
    this.outcome = undefined;
    this.targets = this.targetsOf({});
  }

  private targetsOf(data: Partial<GameEvents['getPlayableCards']>): Targets {
    return {
      playableCards: unwrap(data.playableCards, []),
      playableNoTargets: unwrap(data.playableNoTargets, []),
      playableTriggers: unwrap(data.playableTriggers, []),
      availableAttackTargets: unwrap(data.availableAttackTargets, {}),
    };
  }

  private connect(data: Frame<'connect'>): void {
    this.reset();
    this.current = { id: data.gameId, type: data.gameType };
    this.self = playerOf(data.you);
    this.other = playerOf(data.enemy);
    this.turnNumber = data.turn;
    this.turnOwner = data.userTurn;
    this.held = unwrap(data.hand, []);
    this.cards = unwrap(data.board, []);
    this.targets = this.targetsOf(data);
    unwrap<GameSlotState[]>(data.slots, []).forEach((slot) => this.updateSlot(slot));
    this.stats(data);
    this.emit('started');
  }

  private stats(data: Partial<GameEvents['getPlayersStats']>): void {
    const golds = unwrap<Record<string, number>>(data.golds, {});
    const hands = unwrap<Record<string, number>>(data.handsSize, {});
    const decks = unwrap<Record<string, number>>(data.decksSize, {});
    [this.self, this.other].forEach((player) => {
      if (!player) return;
      const key = `${player.id}`;
      if (key in golds) player.gold = golds[key];
      if (key in hands) player.handSize = hands[key];
      if (key in decks) player.deckSize = decks[key];
    });
  }

  private playerById(id: number): Mutable<GamePlayerState> | undefined {
    if (this.self?.id === id) return this.self;
    return this.other?.id === id ? this.other : undefined;
  }

  private hp(data: Frame<'getUpdatePlayerHp'>): void {
    const player = this.playerById(data.playerId);
    if (!player) return;
    player.hp = data.hp;
    player.maxHp = data.maxHp;
  }

  private turnStart(data: Frame<'getTurnStart'>): void {
    this.turnOwner = data.idPlayer;
    this.turnNumber = data.numTurn;
    this.emit('turn', data.numTurn, this.myTurn);
  }

  private updateSlot(slot: GameSlotState | undefined): void {
    if (slot) this.slotList.set(slot.id, slot);
  }

  private played(card: GameCardState | undefined, playerId: number, position?: number): void {
    if (!card) return;
    this.held = this.held.filter(({ id }) => id !== card.id);
    if (position !== undefined) {
      this.cards = [
        ...this.cards.filter(({ id }) => id !== card.id),
        { ...card, ownerId: playerId, boardPosition: card.boardPosition ?? position },
      ];
    }
    this.emit('played', card, playerId === this.self?.id);
  }

  private destroyed(id: number): void {
    const card = this.cards.find((placed) => placed.id === id);
    this.cards = this.cards.filter((placed) => placed.id !== id);
    if (card) this.emit('died', card);
  }

  private updateCard(card: GameCardState | undefined): void {
    if (!card || card.id === undefined) return;
    const merge = (list: GameCardState[]) => list.map((entry) => (
      entry.id === card.id ? { ...entry, ...card } : entry
    ));
    if (this.cards.some(({ id }) => id === card.id)) {
      this.cards = merge(this.cards);
    } else {
      this.held = merge(this.held);
    }
  }

  private resultOf(data: GameResultFrame): GameResult {
    const player = this.self && { ...this.self };
    const opponent = this.other && { ...this.other };
    if (data.action === 'getVictory') {
      return {
        winner: player,
        loser: opponent,
        won: true,
        reason: reasonOf(data.disconnected ? 'game-end-disconnection' : undefined),
        data,
      };
    }
    if (data.action === 'getDefeat') {
      return { winner: opponent, loser: player, won: false, reason: reasonOf(data.endType), data };
    }
    const winner = [player, opponent].find((entry) => entry?.id === Number(data.winner));
    const loser = [player, opponent].find((entry) => entry?.id === Number(data.looser));
    return {
      winner,
      loser,
      won: winner && player ? winner.id === player.id : undefined,
      reason: reasonOf(data.cause),
      data,
    };
  }

  private finish(data: GameResultFrame): void {
    if (this.outcome !== undefined || !this.current) return;
    this.outcome = this.resultOf(data);
    this.emit('finished', this.outcome);
  }
}
