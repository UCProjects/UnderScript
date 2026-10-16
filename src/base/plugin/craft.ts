import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import craft from 'src/structures/craft/craft';

type CraftEvent = keyof UnderScriptCraftEvents;

type CraftListener<K extends CraftEvent> = (
  this: UnderScriptEventMeta,
  ...args: UnderScriptCraftEvents[K]
) => unknown;

wrap(() => {
  const name = 'craft';

  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptCraftPlugin> {
    function log(error: unknown, event: string, args: unknown[]) {
      plugin.logger.error(`Craft event error (${event}):\n`, error, '\n', JSON.stringify({ args }));
    }

    function wrapper<K extends CraftEvent>(fn: CraftListener<K>, event: K) {
      function listener(this: UnderScriptEventMeta, ...args: UnderScriptCraftEvents[K]) {
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

    const obj: UnderScriptCraftPlugin = {
      get dust() {
        return craft.dust;
      },
      on(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        craft.on(event, wrapper(fn, event));
        return obj;
      },
      once(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        craft.once(event, wrapper(fn, event));
        return obj;
      },
      off(event, fn) {
        craft.off(event, fn);
        return obj;
      },
      craft: (id, options) => craft.craft(id, options),
      disenchant: (id, options) => craft.disenchant(id, options),
      auto: () => craft.auto(),
    };

    return Object.freeze(obj);
  }

  registerModule(name, mod, 'logger');
});
