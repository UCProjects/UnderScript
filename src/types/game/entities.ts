import type { Open } from './wire';

export type GameSoulName =
  | 'KINDNESS'
  | 'DETERMINATION'
  | 'PATIENCE'
  | 'BRAVERY'
  | 'JUSTICE'
  | 'PERSEVERANCE'
  | 'INTEGRITY'
  | 'MONSTER';

export type GameDivision =
  | 'COPPER_III'
  | 'COPPER_II'
  | 'COPPER_I'
  | 'IRON_III'
  | 'IRON_II'
  | 'IRON_I'
  | 'GOLD_III'
  | 'GOLD_II'
  | 'GOLD_I'
  | 'EMERALD_III'
  | 'EMERALD_II'
  | 'EMERALD_I'
  | 'DIAMOND_III'
  | 'DIAMOND_II'
  | 'DIAMOND_I'
  | 'MASTER'
  | 'HIGH_MASTER'
  | 'ULTIMATE_MASTER'
  | 'LEGEND';

export type GameType = Open<
  | 'STANDARD'
  | 'RANKED'
  | 'EVENT'
  | 'CUSTOM'
  | 'TUTORIAL'
  | 'BOSS'
  | 'TOURNAMENT'
  | 'STORY'
  | 'CPU'
  | 'FUN'
>;

export type GameSoul = {
  id: number;
  name: GameSoulName;
  lives?: number;
};

export type GameGroup = {
  id: number;
  name: string;
  priority: number;
  icon?: string;
};

export type GameEmote = {
  code: string;
  id: number;
  name: string;
  image: string;
  ucpCost: number;
};

export type GameCosmetic = {
  id: number;
  name: string;
  image: string;
  ucpCost: number;
};

export type GameAvatar = GameCosmetic & {
  rarity: Open<'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'TOKEN'>;
};

export type GamePlayer = {
  id: number;
  username: string;
  division: Open<GameDivision>;
  oldDivision: Open<GameDivision>;
  groups: GameGroup[];
  soul: GameSoul;
  hp: number;
  maxHp: number;
  golds: number;
  afk: boolean;
  side: number;
  emotes: GameEmote[];
  avatar: GameAvatar;
  profileSkin: GameCosmetic;
  frameSkin: GameCosmetic;
  contributor: boolean;
};

export type GameArtifact = {
  id: number;
  name: string;
  image: string;
  cost: number;
  legendary: boolean;
  unavailable: boolean;
  custom: number;
  disabled: boolean;
  artifactType: number;
  counter?: number;
  progress?: number;
  goal?: number;
};

export type GameStatus = {
  name: string;
  statusType: Open<'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>;
  statusBehavior: Open<'UNIQUE' | 'STACKABLE' | 'REPLACE'>;
  counter: number;
  displayCounter: boolean;
};

export type GameCreatorInfo = {
  id: number;
  typeCreator: number;
  name?: string;
};

export type GameCard = {
  id: number;
  fixedId: number;
  typeCard: number;
  name: string;
  image: string;
  baseImage: string;
  cost: number;
  originalCost: number;
  rarity: Open<'BASE' | 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'DETERMINATION' | 'TOKEN' | 'STORY'>;
  extension: Open<'BASE' | 'DELTARUNE' | 'UTY'>;
  tribes: string[];
  shiny: boolean;
  quantity: number;
  frameSkinName: Open<'Undertale' | 'Deltarune'>;
  typeSkin: number;
  playedTurn: number;
  drawnTurn: number;
  owner: GamePlayer;
  ownerId: number;
  selectCards: GameCard[];
  statuses: GameStatus[];
  attack?: number;
  hp?: number;
  maxHp?: number;
  originalAttack?: number;
  originalHp?: number;
  dead?: boolean;
  boardPosition?: number;
  target?: Open<'MONSTER' | 'ALL' | 'ALLY_MONSTER' | 'ENEMY_MONSTER' | 'HAND' | 'PLAYER'>;
  creatorInfo?: GameCreatorInfo;
  soul?: GameSoul;
  caughtMonster?: GameCard;
};

export type GameEnchant = {
  name: string;
  enchantType: Open<'POSITIVE' | 'NEGATIVE'>;
  duration: number;
  custom: number;
};

export type GameSlot = {
  id: number;
  enchant?: GameEnchant;
};

type BattleLogTargets = {
  playerId: number;
  targetPlayers?: GamePlayer[] | null;
  targetCards?: GameCard[] | null;
  targetSlots?: GameSlot[] | null;
};

export type GameBattleLog = BattleLogTargets & (
  | { battleLogType: 'SOUL_EFFECT'; playerActor: GamePlayer }
  | { battleLogType: 'ARTIFACT_EFFECT'; artifactActor: GameArtifact }
  | { battleLogType: 'ENCHANT_EFFECT'; enchantActor: GameEnchant }
  | {
    battleLogType: 'PLAY_MONSTER' | 'CARD_EFFECT' | 'ATTACK_MONSTER' | 'ATTACK_PLAYER' | 'DEATH' | 'BURN';
    cardActor: GameCard;
  }
);

export type GameBattleLogType = GameBattleLog['battleLogType'];
