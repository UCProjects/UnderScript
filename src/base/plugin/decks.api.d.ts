type UnderScriptDeckCard = {
  readonly id: number | string;
  readonly shiny: boolean;
};

type UnderScriptCurrentDeck = {
  readonly soul: string;
  readonly cards: ReadonlyArray<UnderScriptDeckCard>;
  readonly artifacts: ReadonlyArray<number | string>;
};

type UnderScriptDeckMeta = {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  all(): Record<string, Record<string, unknown>>;
  of(plugin: string): Record<string, unknown>;
};

type UnderScriptSavedDeck = {
  readonly soul: string;
  readonly index: number;
  readonly exists: boolean;
  readonly cards: ReadonlyArray<UnderScriptDeckCard>;
  readonly artifacts: ReadonlyArray<number | string>;
  name: string | undefined;
  description: string | undefined;
  readonly meta: UnderScriptDeckMeta;
  load(): Promise<UnderScriptDeckChange[]>;
  remove(): void;
};

type UnderScriptDeckChange = {
  readonly soul: string | undefined;
  readonly action: string;
  readonly id?: number | string;
  readonly shiny?: boolean;
};

type UnderScriptDeckTarget = {
  readonly cards: ReadonlyArray<{ readonly id: number | string; readonly shiny?: boolean }>;
  readonly artifacts?: ReadonlyArray<number | string>;
};

type UnderScriptDeckCardOptions = {
  shiny?: boolean;
};

type UnderScriptDecksEvents = {
  changed: [change: UnderScriptDeckChange];
};

type UnderScriptDecksPlugin = {
  on<K extends keyof UnderScriptDecksEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptDecksEvents[K]) => unknown): UnderScriptDecksPlugin;
  once<K extends keyof UnderScriptDecksEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptDecksEvents[K]) => unknown): UnderScriptDecksPlugin;
  off<K extends keyof UnderScriptDecksEvents>(event: K, listener: (...args: UnderScriptDecksEvents[K]) => unknown): UnderScriptDecksPlugin;
  saved(soul?: string): UnderScriptSavedDeck[];
  get(soul: string, index: number): UnderScriptSavedDeck | undefined;
  current(): Promise<Record<string, UnderScriptCurrentDeck>>;
  save(soul: string, slot: number): Promise<UnderScriptSavedDeck>;
  addCard(soul: string, id: number | string, options?: UnderScriptDeckCardOptions): Promise<UnderScriptDeckChange>;
  removeCard(soul: string, id: number | string, options?: UnderScriptDeckCardOptions): Promise<UnderScriptDeckChange>;
  addArtifact(soul: string, id: number | string): Promise<UnderScriptDeckChange>;
  clear(soul: string): Promise<UnderScriptDeckChange>;
  clearArtifacts(soul: string): Promise<UnderScriptDeckChange>;
  load(soul: string, deck: UnderScriptDeckTarget): Promise<UnderScriptDeckChange[]>;
};

interface UnderScriptPlugin {
  readonly decks: Readonly<UnderScriptDecksPlugin>;
}
