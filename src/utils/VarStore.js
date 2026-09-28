/** @template T */
export default class VarStore {
  /** @type {T} */
  #default;
  /** @type {T} */
  #value;

  /** @param {T} def */
  constructor(def) {
    this.#default = def;
    this.#value = def;
    Object.freeze(this);
  }

  /** @returns {T} */
  get value() {
    return this.#value;
  }

  /** @param {T} val */
  set value(val) {
    this.set(val);
  }

  /** @returns {T} */
  consume() {
    const ret = this.#value;
    this.set(this.#default);
    return ret;
  }

  /** @returns {T} */
  get() {
    return this.#value;
  }

  /**
   * @param {T} val
   * @returns {T}
   */
  set(val) {
    this.#value = val;
    return val;
  }

  isSet() {
    return this.#value !== this.#default;
  }
}
