import sleep from './sleep';

type Listener = ((this: UnderScriptEventMeta, ...args: any[]) => unknown) & {
  displayName?: string;
  original?: unknown;
};

type Options = {
  cancelable: boolean | undefined;
  canceled: boolean;
  singleton: boolean;
  async: boolean;
};

type EmitOptions = Partial<Options>;

type Singleton = {
  data: unknown[];
  async: boolean;
};

export default function eventEmitter<
  M extends Record<keyof M, any[]> = Record<string, any[]>,
>(): UnderScriptEventEmitter<{}, M> {
  const events: Record<string, Listener[]> = {
    // eventName: [events]
  };
  const singletonEvents: Record<string, Singleton> = {
    // eventName: { data, async }
  };
  const options: Options = {
    cancelable: undefined,
    canceled: false,
    singleton: false,
    async: false,
  };

  function reset(): Options {
    const ret = { ...options };
    options.cancelable = undefined;
    options.canceled = false;
    options.singleton = false;
    options.async = false;
    return ret;
  }

  function emit(
    event: string,
    e: unknown,
    ...data: unknown[]
  ): UnderScriptEmitResult | Promise<UnderScriptEmitResult> {
    const {
      canceled: canceledState,
      cancelable = canceledState,
      singleton,
      async,
    } = reset();

    const delayed = e !== events[event];

    // If this event has run previously, don't run it again
    if (singletonEvents[event] && !delayed) {
      const ret = {
        ran: false,
        canceled: false,
      };
      if (async) return Promise.resolve(ret);
      return ret;
    }

    if (singleton) { // Need to save even if we don't run
      singletonEvents[event] = {
        data,
        async,
      };
    }

    let ran = false;
    let canceled = canceledState;
    const promises: Array<Promise<unknown>> = [];

    if (Array.isArray(e) && e.length) {
      ran = true;
      [...e].forEach((ev: Listener) => {
        // Should we stop processing on cancel? Maybe.
        try {
          const meta = { event, cancelable, canceled, async, delayed, singleton };
          const ret = ev.call(meta, ...data);
          if (async && ret !== undefined) {
            promises.push(Promise.resolve(ret)
              .then(() => canceled = !!meta.canceled) // This is so broken, should process these one at a time
              .catch((err) => {
                console.error(`Error occurred while parsing (async) event: ${ev.displayName || ev.name || 'unnamed'}(${event})`, err, ...data);
              }));
          }
          canceled = !!meta.canceled;
        } catch (err) {
          console.error(`Error occurred while parsing event: ${ev.displayName || ev.name || 'unnamed'}(${event})`, err, ...data);
        }
      });
    }

    function results(): UnderScriptEmitResult {
      return {
        ran,
        canceled: cancelable && canceled,
      };
    }

    if (async) {
      return Promise.all(promises).then(results);
    }

    return results();
  }

  function off(event: string, fn: unknown): void {
    event.split(' ').forEach((e) => {
      const list = events[e] || [];
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] === fn || list[i].original === fn) {
          list.splice(i, 1);
        }
      }
    });
  }

  const emitter = {
    on(this: UnderScriptEventEmitter, event: string, fn: Listener) {
      reset();
      if (typeof fn !== 'function') return this;
      event.split(' ').forEach((e) => {
        const singleton = singletonEvents[e];
        if (singleton) {
          sleep().then(() => {
            reset(); // Make sure nothing is set!
            options.async = singleton.async;
            emit(e, [fn], ...singleton.data);
          });
        } else {
          if (!Array.isArray(events[e])) {
            events[e] = [];
          }
          events[e].push(fn);
        }
      });
      return this;
    },
    once(this: UnderScriptEventEmitter, event: string, fn: Listener) {
      if (typeof fn !== 'function') return this;
      function wrapper(this: UnderScriptEventMeta, ...args: unknown[]) {
        off(event, wrapper);
        return fn.call(this, ...args);
      }
      return this.on(event, wrapper);
    },
    one(this: UnderScriptEventEmitter, event: string, fn: Listener) {
      return this.once(event, fn);
    },
    until(this: UnderScriptEventEmitter, event: string, fn: Listener) {
      if (typeof fn !== 'function') return this;
      function wrapper(this: UnderScriptEventMeta, ...args: unknown[]): unknown {
        const ret = fn.call(this, ...args);
        if (ret instanceof Promise) {
          return ret.then((val) => {
            if (val) off(event, wrapper);
            return val;
          });
        }
        if (ret) {
          off(event, wrapper);
        }
        return ret;
      }
      return this.on(event, wrapper);
    },
    emit(first: string | EmitOptions, ...rest: unknown[]) {
      if (typeof first !== 'object' || first === null) {
        const event = first as string;
        return emit(event, singletonEvents[event] || events[event], ...rest);
      }
      const given = first as EmitOptions;
      const [event, ...data] = rest as [string, ...unknown[]];
      (['cancelable', 'canceled', 'singleton', 'async'] as const).forEach((key) => {
        if (given[key] !== undefined) options[key] = !!given[key];
      });
      return emit(event, singletonEvents[event] || events[event], ...data);
    },
    off(this: UnderScriptEventEmitter, event: string, fn: unknown) {
      off(event, fn);
      return this;
    },
  };

  (Object.keys(options) as Array<keyof Options>).forEach((key) => {
    Object.defineProperty(emitter, key, {
      get() {
        options[key] = true;
        return this;
      },
    });
  });

  return Object.freeze(emitter) as unknown as UnderScriptEventEmitter<{}, M>;
}
