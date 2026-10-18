type UnderScriptCraftAction = 'craft' | 'disenchant' | 'auto';

type UnderScriptCraftResult = {
  readonly id: number | string;
  readonly name: string;
  readonly dust: number;
  readonly shiny: boolean;
};

type UnderScriptCraftRejection = {
  readonly action: UnderScriptCraftAction;
  readonly message: string;
  readonly status: string;
};

type UnderScriptSmartDisenchant = {
  readonly cards: ReadonlyArray<{ readonly id: number | string; readonly shiny: boolean; readonly quantity: number }>;
  readonly dust: number;
  readonly gained: number;
  readonly stopped: boolean;
};

type UnderScriptAutoDisenchant = {
  readonly cards: ReadonlyArray<{ readonly id: number | string; readonly shiny: boolean; readonly owned: number }>;
  readonly dust: number;
};

type UnderScriptCraftEvents = {
  crafted: [crafted: UnderScriptCraftResult];
  disenchanted: [disenchanted: UnderScriptCraftResult];
  smartDisenchanted: [run: UnderScriptSmartDisenchant];
  autoDisenchanted: [auto: UnderScriptAutoDisenchant];
  rejected: [rejection: UnderScriptCraftRejection];
};

type UnderScriptCraftOptions = {
  shiny?: boolean;
};

type UnderScriptCraftPlugin = Pick<UnderScriptCraft, 'dust'> & {
  on<K extends keyof UnderScriptCraftEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptCraftEvents[K]) => unknown): UnderScriptCraftPlugin;
  once<K extends keyof UnderScriptCraftEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptCraftEvents[K]) => unknown): UnderScriptCraftPlugin;
  off<K extends keyof UnderScriptCraftEvents>(event: K, listener: (...args: UnderScriptCraftEvents[K]) => unknown): UnderScriptCraftPlugin;
  craft(id: number | string, options?: UnderScriptCraftOptions): Promise<UnderScriptCraftResult>;
  disenchant(id: number | string, options?: UnderScriptCraftOptions): Promise<UnderScriptCraftResult>;
  autoDisenchant(): Promise<UnderScriptAutoDisenchant>;
};

interface UnderScriptPlugin {
  readonly craft: Readonly<UnderScriptCraftPlugin>;
}
