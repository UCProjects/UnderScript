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
        if (!plugin.isActive) return undefined;
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

    type Flags = Partial<Record<typeof options[number], true>>;
    const warned = new Set<string>();

    function warnDeprecated(key: string): void {
      if (warned.has(key)) return;
      warned.add(key);
      plugin.logger.warn(`events.emit.${key} is deprecated, pass \`{ ${key}: true }\` to emit directly.`);
    }

    function createEmit(flags: Flags = {}): UnderScriptEmit {
      const call = ((...args: unknown[]) => {
        const [first] = args;
        const given = typeof first === 'object' && first !== null;
        const merged = { ...flags, ...(given ? first as Flags : {}) };
        const rest = given ? args.slice(1) : args;
        if (!plugin.isActive) {
          const result = { ran: false, canceled: merged.canceled === true };
          return merged.async ? Promise.resolve(result) : result;
        }
        return (eventManager.emit as (...params: unknown[]) => unknown)(merged, ...rest);
      }) as unknown as UnderScriptEmit;

      options.forEach((key) => {
        Object.defineProperty(call, key, {
          get: () => {
            warnDeprecated(key);
            return createEmit({ ...flags, [key]: true });
          },
        });
      });
      return call;
    }

    const emit = createEmit();

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
      on(event: string, fn: Listener): UnderScriptPluginEvents {
        if (typeof fn !== 'function') throw new Error('Must pass a function');

        if (event.split(' ').includes(':loaded')) {
          plugin.logger.warn('Event manager: `:loaded` is deprecated, ask author to update to `:preload`!');
        }

        eventManager.on.call(obj, event, wrapper(fn, event));
        return obj;
      },
      off(event: string, fn: (...args: any[]) => unknown): UnderScriptPluginEvents {
        eventManager.off(event, fn);
        return obj;
      },
      emit,
    } as unknown as UnderScriptPluginEvents;

    return Object.freeze(obj);
  }

  registerModule(name, mod, 'logger');
});
