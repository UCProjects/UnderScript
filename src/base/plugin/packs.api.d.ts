type UnderScriptPackCard = {
  readonly id: number;
  readonly name: string;
  readonly rarity: string;
  readonly shiny: boolean;
  readonly new: boolean;
};

type UnderScriptPacksBought = {
  readonly count: number;
  readonly requested: number;
  readonly type: UnderScriptBuyPackType;
  readonly gold: boolean;
  readonly stopped: boolean;
  readonly error?: string;
};

type UnderScriptPacksOpened = {
  readonly count: number;
  readonly requested: number;
  readonly type: UnderScriptOpenPackType;
  readonly cards: ReadonlyArray<UnderScriptPackCard>;
  readonly stopped: boolean;
  readonly error?: string;
};

type UnderScriptPacksRejection = {
  readonly action: string;
  readonly message: string;
};

type UnderScriptPacksEvents = {
  bought: [bought: UnderScriptPacksBought];
  opened: [opened: UnderScriptPacksOpened];
  rejected: [rejection: UnderScriptPacksRejection];
};

type UnderScriptPacksBuyOptions = {
  type?: UnderScriptBuyPackType;
  gold?: boolean;
};

type UnderScriptPacksPlugin = {
  readonly buying: boolean;
  readonly opening: boolean;
  on<K extends keyof UnderScriptPacksEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptPacksEvents[K]) => unknown): UnderScriptPacksPlugin;
  once<K extends keyof UnderScriptPacksEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptPacksEvents[K]) => unknown): UnderScriptPacksPlugin;
  off<K extends keyof UnderScriptPacksEvents>(event: K, listener: (...args: UnderScriptPacksEvents[K]) => unknown): UnderScriptPacksPlugin;
  buy(count: number, options?: UnderScriptPacksBuyOptions): Promise<UnderScriptPacksBought>;
  open(count: number, type?: UnderScriptOpenPackType | UnderScriptItem): Promise<UnderScriptPacksOpened>;
};

interface UnderScriptPlugin {
  readonly packs: Readonly<UnderScriptPacksPlugin>;
}
