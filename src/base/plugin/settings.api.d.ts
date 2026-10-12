type UnderScriptDynamic<T> = T | (() => T);

type UnderScriptBuiltinSettingType =
  | 'array'
  | 'boolean'
  | 'color'
  | 'hr'
  | 'keybind'
  | 'list'
  | 'map'
  | 'password'
  | 'remove'
  | 'select'
  | 'slider'
  | 'text';

type UnderScriptSettingType = UnderScriptBuiltinSettingType | `${string}:${string}` | object;

type UnderScriptSelectOption = string | number | readonly [label: string | number, value?: string | number];

type UnderScriptSelectValue<O> =
  O extends readonly [unknown, infer V extends string | number] ? `${V}`
  : O extends readonly [infer L extends string | number] ? `${L}`
  : O extends string | number ? `${O}`
  : never;

type UnderScriptSettingOptions<T = unknown, S = T> = {
  key: string;
  name?: UnderScriptDynamic<string>;
  type?: UnderScriptSettingType;
  default?: UnderScriptDynamic<S>;
  category?: { toString(): string };
  note?: UnderScriptDynamic<string | null>;
  description?: UnderScriptDynamic<string | null>;
  disabled?: UnderScriptDynamic<boolean | null>;
  hidden?: UnderScriptDynamic<boolean | null>;
  remove?: UnderScriptDynamic<boolean | null>;
  export?: UnderScriptDynamic<boolean | null>;
  reset?: UnderScriptDynamic<boolean | null>;
  refresh?: UnderScriptDynamic<boolean | null>;
  extraPrefix?: string;
  data?: UnderScriptDynamic<unknown>;
  options?: ReadonlyArray<unknown>;
  min?: number;
  max?: number;
  step?: number;
  onChange?(value: T, previous: T): void;
  converter?(stored: string): S | null | undefined;
  transform?(value: S): T;
};

type UnderScriptSetting<T = unknown, S = T> = {
  readonly key: string;
  readonly disabled: boolean;
  value(): T;
  set(value: S | null | undefined): void;
  on(listener: (value: T, previous: T) => void): void;
  show(scroll?: boolean): void;
  refresh(): void;
};

type UnderScriptSettingsPage = {
  add<
    const O extends ReadonlyArray<UnderScriptSelectOption>,
    T = UnderScriptSelectValue<O[number]>,
  >(
    setting: Omit<UnderScriptSettingOptions<T, UnderScriptSelectValue<O[number]>>, 'type' | 'options'> & {
      type?: 'select';
      options: O;
    },
  ): UnderScriptSetting<T, UnderScriptSelectValue<O[number]>>;
  add<S = unknown, T = S>(setting: UnderScriptSettingOptions<T, S>): UnderScriptSetting<T, S>;
  open(): void;
};

type UnderScriptSettingsEvents = {
  'setting:change': [key: string, value: unknown, previous: unknown];
  'open': [];
  'close': [];
};

type UnderScriptSettings = UnderScriptSettingsPage & {
  page(name: string): Readonly<UnderScriptSettingsPage>;
  name(value: string): boolean;
  on<E extends keyof UnderScriptSettingsEvents>(
    event: E,
    listener: (...args: UnderScriptSettingsEvents[E]) => void,
  ): void;
  on(fullKey: string, listener: (value: unknown, previous: unknown) => void): void;
  isOpen(): boolean;
  addType(type: UnderScriptCustomSetting): void;
  value(fullKey: string): unknown;
};

interface UnderScriptPlugin {
  settings(): Readonly<UnderScriptSettings>;
}
