import eventManager from '../../utils/eventManager.js';
import wrap from '../../utils/2.pokemon.js';
import { registerModule } from '../../utils/plugin.js';
import { capturePluginError } from '../../utils/sentry.js';

wrap(() => {
  const options = ['cancelable', 'canceled', 'singleton', 'async'];

  const name = 'events';
  function mod(plugin) {
    const obj = {
      ...eventManager,
      on(event = '', fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');

        function pluginListener(...args) {
          try {
            fn.call(this, ...args);
          } catch (e) {
            capturePluginError(plugin, e, {
              args,
              ...this,
            });
            plugin.logger.error(`Event error (${event}):\n`, e, '\n', JSON.stringify({
              args,
              event: this,
            }));
          }
        }
        pluginListener.plugin = plugin;

        if (event.split(' ').includes(':loaded')) {
          plugin.logger.warn('Event manager: `:loaded` is deprecated, ask author to update to `:preload`!');
        }

        eventManager.on.call(obj, event, pluginListener);
      },
      emit(...args) {
        return eventManager.emit(...args);
      },
    };

    options.forEach((key) => {
      Object.defineProperty(obj.emit, key, {
        get: () => {
          // Toggle the event manager
          eventManager[key]; // eslint-disable-line no-unused-expressions
          // Return our object
          return obj.emit;
        },
      });
    });

    return Object.freeze(obj);
  }

  registerModule(name, mod);
});
