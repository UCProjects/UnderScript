function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';
}

export default class LazyStore<T> {
  #factory: () => T;

  #value?: T;

  #started = false;

  #loaded = false;

  constructor(factory: () => T) {
    if (typeof factory !== 'function') throw new TypeError('LazyStore needs a function');
    this.#factory = factory;
    Object.freeze(this);
  }

  get value(): T {
    return this.get();
  }

  get(): T {
    if (!this.#started) {
      const value = this.#factory();
      this.#value = value;
      this.#started = true;
      if (isThenable(value)) {
        value.then(
          () => {
            if (this.#value === value) this.#loaded = true;
          },
          () => {
            if (this.#value === value) this.reset();
          },
        );
      } else {
        this.#loaded = true;
      }
    }
    return this.#value as T;
  }

  isLoaded(): boolean {
    return this.#loaded;
  }

  reset(): void {
    this.#value = undefined;
    this.#started = false;
    this.#loaded = false;
  }
}
