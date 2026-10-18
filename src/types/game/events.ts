import type {
  GameArtifact,
  GameAvatar,
  GameBattleLog,
  GameCard,
  GameCosmetic,
  GameDivision,
  GameEmote,
  GameGroup,
  GamePlayer,
  GameSlot,
  GameSoul,
  GameType,
} from './entities';
import type { JsonString, Loose, Open } from './wire';

type ById<T> = Record<string, T>;

type Targets = {
  playableCards: JsonString<number[]>;
  playableNoTargets: JsonString<number[]>;
  playableTriggers: JsonString<number[]>;
  availableAttackTargets: JsonString<ById<number[]>>;
};

type Affected = {
  waitTime: number;
  affecteds: JsonString<number[]>;
  affectedSlots: JsonString<number[]>;
  battleLog: Loose<GameBattleLog>;
  playerAffected1?: number;
  playerAffected2?: number;
};

type Reward = {
  gameType: GameType;
  golds?: number;
  oldGold?: number;
  oldXp?: number;
  newXp?: number;
  nbLevelPassed?: number;
  oldJaugeSize?: number;
  jaugeSize?: number;
  xpUntilNextLevel?: number;
  queueGoldBonus?: number;
  oldDivision?: unknown;
  newDivision?: unknown;
  oldElo?: unknown;
  newElo?: unknown;
  rewardStringKey?: unknown;
  rewardType?: unknown;
  rewardQuantity?: unknown;
  bonusRewardStringKey?: unknown;
  bonusRewardType?: unknown;
  bonusRewardQuantity?: unknown;
};

export type GameEvents = {
  connect: Targets & {
    packetDate: number;
    gameId: number;
    gameType: GameType;
    idFight: number;
    startingPlayerId: number;
    turn: number;
    userTurn: number;
    turnTime: number;
    totalTurnAnimationDuration: number;
    lockTime: number;
    isMulliganDone: boolean;
    you: JsonString<GamePlayer>;
    enemy: JsonString<GamePlayer>;
    yourLevel: number;
    enemyLevel: number;
    yourRank: Open<GameDivision>;
    enemyRank: Open<GameDivision>;
    yourSoul: JsonString<GameSoul>;
    enemySoul: JsonString<GameSoul>;
    yourGroups: JsonString<GameGroup[]>;
    enemyGroups: JsonString<GameGroup[]>;
    yourMainGroup: JsonString<GameGroup | null>;
    enemyMainGroup: JsonString<GameGroup | null>;
    yourEmotes: JsonString<GameEmote[]>;
    yourAvatar: JsonString<GameAvatar>;
    enemyAvatar: JsonString<GameAvatar>;
    yourShinyAvatar: boolean;
    enemyShinyAvatar: boolean;
    yourProfileSkin: JsonString<GameCosmetic>;
    enemyProfileSkin: JsonString<GameCosmetic>;
    yourArtifacts: JsonString<GameArtifact[]>;
    enemyArtifacts: JsonString<GameArtifact[]>;
    handsSize: JsonString<ById<number>>;
    decksSize: JsonString<ById<number>>;
    golds: JsonString<ById<number>>;
    goldsNextTurn: JsonString<ById<number>>;
    hand: JsonString<GameCard[]>;
    board: JsonString<GameCard[]>;
    slots: JsonString<GameSlot[]>;
    dustpile: JsonString<GameCard[]>;
    battleLogs: JsonString<GameBattleLog[]>;
    waitingCardRange?: JsonString<GameCard>;
    waitingCardKind?: string;
    waitingCardX?: number;
    waitingCardAvailableTargets?: JsonString<number[]>;
  };
  getAnimation: {
    animation: Open<
      | 'BIG_DAMAGE'
      | 'BLACK_OUT'
      | 'SAVE'
      | 'LOAD'
      | 'BARRIER_BREAK'
      | 'DRAW'
      | 'SILENCE'
      | 'SPELL'
      | 'ATTACK_BUFF'
      | 'HP_BUFF'
      | 'ATTACK_DEBUFF'
      | 'HP_DEBUFF'
      | 'FREEZE'
      | 'POISON'
      | 'HEAL'
      | 'HP_STAT'
      | 'COST_STAT'
      | 'ATTACK_STAT'
    >;
    waitTime: number;
    target?: Open<'PLAYER' | 'MONSTER'>;
    idTarget?: number;
    value?: number;
  };
  getArtifactDoingEffect: Affected & {
    playerId: number;
    artifactId: number;
    idArtifact?: number;
  };
  getAttackDelock: {
    attackMonster: number;
    targetId: number;
  };
  getBattleLog: {
    battleLog: JsonString<GameBattleLog>;
  };
  getBotDelay: {
    waitTime: number;
  };
  getCardDestroyedHandFull: {
    waitTime: number;
    card: JsonString<GameCard>;
    idPlayer: number;
    battleLog: Loose<GameBattleLog>;
  };
  getDefeat: Reward & {
    endType: Open<'game-end-lethal' | 'game-end-surrender'>;
    soul?: string;
  };
  getDialog: {
    translationId: string;
    force: boolean;
    waitTime?: number;
    avatar?: string;
    sound?: string;
  };
  getDoingEffect: Affected & {
    card: JsonString<GameCard>;
  };
  getEnchantDoingEffect: Affected & {
    playerId: number;
    slotId: number;
  };
  getFight: {
    waitTime: number;
    attackMonster: number;
    defendMonster: number;
    dmgMonster: number;
  };
  getFightPlayer: {
    waitTime: number;
    attackMonster: number;
    defendPlayer: number;
    dmgMonster: number;
    battleLog: Loose<GameBattleLog>;
  };
  getHideMulligan: Record<never, never>;
  getMonsterDestroyed: {
    monsterId: number;
  };
  getMonsterPlayed: {
    idPlayer: number;
    x: number;
    card: JsonString<GameCard>;
    battleLog: Loose<GameBattleLog>;
    waitTime?: number;
  };
  getMonsterTemp: {
    x: number;
    monster: JsonString<GameCard>;
    availableTargets: JsonString<number[]>;
    selectCards?: JsonString<GameCard[]>;
  };
  getPlayCardRejected: {
    cardId: number;
  };
  getPlayJingle: {
    jingle: string;
  };
  getPlaySound: {
    sound: string;
  };
  getPlayableCards: Targets;
  getPlayersStats: {
    golds: JsonString<ById<number>>;
    handsSize: JsonString<ById<number>>;
    decksSize: JsonString<ById<number>>;
    goldsNextTurn: JsonString<ById<number>>;
    artifacts: JsonString<ById<GameArtifact[]>>;
  };
  getShowMulligan: {
    hand: JsonString<GameCard[]>;
  };
  getSoulDoingEffect: Affected & {
    playerId: number;
  };
  getSpellPlayed: {
    idPlayer: number;
    waitTime: number;
    card: JsonString<GameCard>;
  };
  getSpellTemp: {
    spell: JsonString<GameCard>;
    availableTargets: JsonString<number[]>;
    selectCards?: JsonString<GameCard[]>;
  };
  getTempCancel: Record<never, never>;
  getTurnEnd: {
    idPlayer: number;
  };
  getTurnStart: {
    idPlayer: number;
    numTurn: number;
    turnTime: number;
    afk: boolean;
    packetDate: number;
  };
  getUpdateBoard: {
    board: JsonString<GameCard[]>;
    player1Id: number;
  };
  getUpdateDustpile: {
    dustpile: JsonString<GameCard[]>;
  };
  getUpdateHand: {
    hand: JsonString<GameCard[]>;
  };
  getUpdatePlayerHp: {
    playerId: number;
    hp: number;
    maxHp: number;
    animation: boolean;
    isDamage?: boolean;
  };
  getUpdateSlot: {
    slot: JsonString<GameSlot>;
  };
  getVictory: Reward & {
    disconnected: boolean;
    isDonator?: boolean;
    donatorBonus?: number;
  };
  updateCard: {
    card: JsonString<GameCard>;
  };
};

export type GameEvent = {
  [A in keyof GameEvents]: { action: A } & GameEvents[A];
}[keyof GameEvents];
