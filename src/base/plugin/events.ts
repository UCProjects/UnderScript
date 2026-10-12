import eventManager from 'src/utils/eventManager';
import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import compoundEvent from 'src/utils/compoundEvent';

type Listener = (this: UnderScriptEventMeta, ...args: any[]) => unknown;

const options = ['cancelable', 'canceled', 'singleton', 'async'] as const;

wrap(() => {
  const name = 'events';
  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptPluginEvents> {
    function log(error: unknown, event: string, args: unknown[], meta: unknown) {
      plugin.logger.error(`Event error (${event}):\n`, error, '\n', JSON.stringify({
        args,
        event: meta,
      }));
    }
    function wrapper(fn: Listener, event: string) {
      function listener(this: UnderScriptEventMeta, ...args: unknown[]) {
        try {
          const val = fn.call(this, ...args);
          if (val instanceof Promise) {
            return val.catch((error) => log(error, event, args, this));
          }
          return val;
        } catch (e) {
          log(e, event, args, this);
        }
        return undefined;
      }
      listener.plugin = plugin;
      listener.original = fn;
      return listener;
    }

    const emit = ((...args: unknown[]) => (
      (eventManager.emit as (...params: unknown[]) => unknown)(...args)
    )) as unknown as UnderScriptEmit;

    options.forEach((key) => {
      Object.defineProperty(emit, key, {
        get: () => {
          eventManager[key]; // eslint-disable-line no-unused-expressions
          return emit;
        },
      });
    });

    const obj = {
      ...eventManager,
      compound(...args: unknown[]): void {
        const fn = args.pop();
        const events = args as string[];
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        if (!events.length) throw new Error('Must pass events');
        if (events.length === 1) throw new Error('Use `events.on` for single events');

        compoundEvent(...events, wrapper(fn as Listener, `Compound[${events.join(';')}]`));
      },
      on(event: string, fn: Listener): void {
        if (typeof fn !== 'function') throw new Error('Must pass a function');

        if (event.split(' ').includes(':loaded')) {
          plugin.logger.warn('Event manager: `:loaded` is deprecated, ask author to update to `:preload`!');
        }

        eventManager.on.call(obj, event, wrapper(fn, event));
      },
      off(event: string, fn: (...args: any[]) => unknown): UnderScriptPluginEvents {
        eventManager.off(event, fn);
        return obj;
      },
      emit,
    };

    return Object.freeze(obj);
  }

  registerModule(name, mod);
});
