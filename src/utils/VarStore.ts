export default class VarStore<T = undefined> {
  #default: T;

  #value: T;

  constructor(...args: undefined extends T ? [def?: T] : [def: T]) {
    const [def] = args as [T];
    this.#default = def;
    this.#value = def;
    Object.freeze(this);
  }

  get value(): T {
    return this.#value;
  }

  set value(val: T) {
    this.set(val);
  }

  consume(): T {
    const ret = this.#value;
    this.set(this.#default);
    return ret;
  }

  get(): T {
    return this.#value;
  }

  set(val: T): T {
    this.#value = val;
    return val;
  }

  isSet(): boolean {
    return this.#value !== this.#default;
  }
}
