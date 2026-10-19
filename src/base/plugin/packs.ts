import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import packs from 'src/structures/packs/packs';

type PacksEvent = keyof UnderScriptPacksEvents;

type PacksListener<K extends PacksEvent> = (
  this: UnderScriptEventMeta,
  ...args: UnderScriptPacksEvents[K]
) => unknown;

wrap(() => {
  const name = 'packs';

  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptPacksPlugin> {
    function log(error: unknown, event: string, args: unknown[]) {
      plugin.logger.error(`Packs event error (${event}):\n`, error, '\n', JSON.stringify({ args }));
    }

    function wrapper<K extends PacksEvent>(fn: PacksListener<K>, event: K) {
      function listener(this: UnderScriptEventMeta, ...args: UnderScriptPacksEvents[K]) {
        if (!plugin.isActive) return undefined;
        try {
          const val = fn.call(this, ...args);
          if (val instanceof Promise) {
            return val.catch((error) => log(error, event, args));
          }
          return val;
        } catch (e) {
          log(e, event, args);
        }
        return undefined;
      }
      listener.plugin = plugin;
      listener.original = fn;
      return listener;
    }

    const obj: UnderScriptPacksPlugin = {
      get buying() {
        return packs.buying;
      },
      get opening() {
        return packs.opening;
      },
      on(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        packs.on(event, wrapper(fn, event));
        return obj;
      },
      once(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        packs.once(event, wrapper(fn, event));
        return obj;
      },
      off(event, fn) {
        packs.off(event, fn);
        return obj;
      },
      buy: (count, options) => packs.buy(count, options),
      open: (count, type) => packs.open(count, type),
    };

    return Object.freeze(obj);
  }

  registerModule(name, mod, 'logger');
});
