import Translation from 'src/structures/constants/translation';
import type { Nullish } from 'src/types/utility';
import { translateText } from '../translate';
import SettingType from './types/setting';

const refresh = Translation.Setting('note.refresh');

type SettingOwner = {
  name: string;
  logger?: { error(...args: unknown[]): unknown };
};

type SettingPage = string | SettingOwner | { plugin: SettingOwner; tab: string; name: string };

type Flag = UnderScriptDynamic<Nullish<boolean>>;

type Text = UnderScriptDynamic<Nullish<string | Translation>>;

type Name = UnderScriptDynamic<string | Translation>;

export type RegisteredSettingOptions = {
  category?: { toString(): string };
  converter?(stored: string): unknown;
  data?: unknown;
  default?: unknown;
  description?: Text;
  disabled?: Flag;
  export?: Flag;
  extraPrefix?: string;
  events?: UnderScriptEventEmitter;
  hidden?: Flag;
  key?: string;
  name?: Name;
  note?: Text;
  onChange?(value: any, previous: any): unknown;
  page?: SettingPage;
  refresh?: Flag;
  remove?: Flag;
  reset?: Flag;
  transform?(value: any): any;
  type?: SettingType;
};

export default class RegisteredSetting {
  #key: string;

  #name: Name;

  #type: SettingType;

  #page: SettingPage;

  #category?: { toString(): string };

  #default: unknown;

  #disabled: Flag;

  #hidden: Flag;

  #remove: Flag;

  #export: Flag;

  #prefix?: string;

  #reset: Flag;

  #data: unknown;

  #note: Text;

  #description: Text;

  #refresh: Flag;

  #onChange?: (value: any, previous: any) => unknown;

  #events: UnderScriptEventEmitter;

  #transformer?: (value: any) => any;

  constructor({
    category,
    converter,
    data,
    default: def,
    description,
    disabled,
    export: exporting,
    extraPrefix,
    events,
    hidden,
    key,
    name,
    note,
    onChange,
    page,
    refresh: refreshText,
    remove,
    reset,
    transform,
    type,
  }: RegisteredSettingOptions = {}) {
    this.#key = key as string;
    this.#name = name || (key as string);
    this.#type = type as SettingType;
    this.#page = page as SettingPage;
    this.#category = category;
    this.#default = def;
    this.#disabled = disabled;
    this.#hidden = hidden;
    this.#remove = remove;
    this.#export = exporting;
    this.#prefix = extraPrefix;
    this.#reset = reset;
    this.#data = data;
    this.#note = note;
    this.#description = description;
    this.#refresh = refreshText;
    this.#events = events as UnderScriptEventEmitter;
    this.#transformer = transform;
    if (typeof onChange === 'function') {
      this.#onChange = onChange;
    }

    if (typeof converter === 'function') {
      this.#convert(converter);
    }
  }

  get key(): string {
    return this.#key;
  }

  get name(): string {
    return translateText(this.#value(this.#name));
  }

  get type(): SettingType {
    return this.#type;
  }

  get page(): SettingPage {
    return this.#page;
  }

  get category(): { toString(): string } | undefined {
    return this.#category;
  }

  get disabled(): boolean {
    return this.#value(this.#disabled) === true;
  }

  get hidden(): boolean {
    return this.#value(this.#hidden) === true;
  }

  get remove(): boolean {
    return this.#value(this.#remove) === true;
  }

  get exportable(): boolean {
    return this.#value(this.#export) !== false;
  }

  get extraPrefix(): string | undefined {
    return this.#prefix;
  }

  get reset(): boolean {
    return this.#value(this.#reset) === true;
  }

  get data(): unknown {
    return this.#value(this.#data);
  }

  get description(): string {
    const value = this.#value(this.#description);
    return value ? translateText(value) : '';
  }

  get note(): string {
    const notes: string[] = [];

    const note = this.#value(this.#note);
    if (note) {
      notes.push(translateText(note));
    }

    if (this.#value(this.#refresh)) {
      notes.push(`${refresh}`);
    }

    return notes.join('<br>');
  }

  update(val: unknown): void {
    const {
      key,
      type,
      value: prev,
    } = this;
    if (val === undefined || val === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, type.encode(val));
    }
    this.#onChange?.(this.value, prev);
    this.#events.emit(key, this.value, prev);
    this.#events.emit('setting:change', key, this.value, prev);
  }

  set value(val: unknown) {
    this.update(val);
  }

  get value(): any {
    const val = localStorage.getItem(this.key);
    if (val === null) {
      return this.default;
    }
    return this.#transform(this.type.value(val, this.data));
  }

  get default(): any {
    const val = this.#default;
    if (val !== undefined) {
      return this.#transform(this.type.value(this.#value(val), this.data));
    }
    return this.#transform(this.type.default(this.data));
  }

  #convert(converter: (stored: string) => unknown): void {
    const { key } = this;
    const current = localStorage.getItem(key);
    if (current === null) return;

    const converted = converter(current);
    if (converted === null) {
      localStorage.removeItem(key);
    } else if (converted !== undefined) {
      localStorage.setItem(key, this.type.encode(converted));
    }
  }

  #transform(value: unknown): any {
    if (typeof this.#transformer === 'function') {
      return this.#transformer(value);
    }
    return value;
  }

  #value<T>(input: UnderScriptDynamic<T>): T {
    if (typeof input === 'function') {
      return (input as () => T)();
    }
    return input;
  }
}
