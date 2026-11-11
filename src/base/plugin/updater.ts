import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import { registerPlugin } from 'src/hooks/updates';
import * as settings from 'src/utils/settings/index';
import Translation from 'src/structures/constants/translation';
import VarStore from 'src/utils/VarStore';

const text = Translation.Setting('update.plugin');
const setting = settings.register<boolean>({
  name: text,
  key: 'underscript.disable.plugins.update',
  category: Translation.CATEGORY_PLUGINS,
});

wrap(() => {
  const name = 'updater';
  function mod(plugin: UnderScriptPlugin) {
    if (!plugin.version) return undefined;

    const updater = new VarStore<false | UnderScriptPluginUpdaterUnregister>(false);
    const update = plugin.settings().add({
      name: () => `${text}`,
      key: 'plugin.update',
      default: () => setting.value(),
      disabled: () => setting.value(),
      hidden: () => !updater.value || !plugin.isActive,
    });
    setting.on(() => update.refresh());

    Object.defineProperty(plugin, 'canUpdate', {
      get: () => updater.value && plugin.isActive && !setting.value() && !update.value(),
    });

    return (data: UnderScriptPluginUpdate): UnderScriptPluginUpdaterUnregister => {
      if (!['string', 'object'].includes(typeof data)) throw new Error();
      if (updater.value) throw new Error('Already registered');
      const {
        downloadURL = typeof data === 'string' ? data : undefined,
        updateURL,
      }: { downloadURL?: string; updateURL?: string } = typeof data === 'string' ? {} : data;
      const unregister = registerPlugin(plugin, { downloadURL, updateURL });
      updater.value = unregister;
      return () => {
        unregister();
        updater.reset();
      };
    };
  }

  registerModule(name, mod, 'events', 'settings', 'enabled?');
});
