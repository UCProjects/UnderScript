import wrap from '../../utils/2.pokemon.js';
import { registerModule } from '../../utils/plugin.js';
import * as settings from '../../utils/settings/index.js';

const enable = ['Enabled with toast', 'Enabled silently'];

const setting = settings.register({
  name: 'New plugin behavior',
  key: 'enable.plugins',
  category: 'Plugins',
  data: [...enable, 'Disabled with toast', 'Disabled silently'],
  type: 'select',
});

wrap(() => {
  const name = 'enabled';

  function mod(plugin) {
    // if (plugin.version === undefined) return;
    const enabled = plugin.settings().add({ key: 'Enabled', default: enable.includes(setting.value()) });

    Object.defineProperty(plugin, name, {
      get: () => enabled.value(),
    });

    const registered = plugin.settings().add({ key: 'registered', hidden: true });
    if (!registered.value()) {
      if (setting.value().includes('toast')) {
        // TODO: Show toast to toggle setting from default
      } else {
        registered.set(true);
      }
    }
  }

  registerModule(name, mod, ['settings']);
});
