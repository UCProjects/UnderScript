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
  export(options?: UnderScriptDeckExportOptions): string;
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

type UnderScriptDeckImportOptions = {
  slot?: number;
  meta?: boolean;
};

type UnderScriptDeckExportOptions = {
  shiny?: boolean;
};

type UnderScriptDeckCardOptions = {
  shiny?: boolean;
};

type UnderScriptDecksEvents = {
  changed: [change: UnderScriptDeckChange];
};

type UnderScriptDecksStorage = {
  list(soul?: UnderScriptSoul | string): UnderScriptSavedDeck[];
  get(soul: UnderScriptSoul | string, slot: number): UnderScriptSavedDeck | undefined;
  save(soul: UnderScriptSoul | string, slot: number): Promise<UnderScriptSavedDeck>;
  import(code: string, options?: UnderScriptDeckImportOptions): UnderScriptSavedDeck;
};

type UnderScriptDecksPlugin = {
  readonly storage: Readonly<UnderScriptDecksStorage>;
  on<K extends keyof UnderScriptDecksEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptDecksEvents[K]) => unknown): UnderScriptDecksPlugin;
  once<K extends keyof UnderScriptDecksEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptDecksEvents[K]) => unknown): UnderScriptDecksPlugin;
  off<K extends keyof UnderScriptDecksEvents>(event: K, listener: (...args: UnderScriptDecksEvents[K]) => unknown): UnderScriptDecksPlugin;
  current(): Promise<Record<string, UnderScriptCurrentDeck>>;
  addCard(soul: UnderScriptSoul | string, id: number | string, options?: UnderScriptDeckCardOptions): Promise<UnderScriptDeckChange>;
  removeCard(soul: UnderScriptSoul | string, id: number | string, options?: UnderScriptDeckCardOptions): Promise<UnderScriptDeckChange>;
  addArtifact(soul: UnderScriptSoul | string, id: number | string): Promise<UnderScriptDeckChange>;
  clear(soul: UnderScriptSoul | string): Promise<UnderScriptDeckChange>;
  clearArtifacts(soul: UnderScriptSoul | string): Promise<UnderScriptDeckChange>;
  load(soul: UnderScriptSoul | string, deck: UnderScriptDeckTarget): Promise<UnderScriptDeckChange[]>;
};

interface UnderScriptPlugin {
  readonly decks: Readonly<UnderScriptDecksPlugin>;
}
