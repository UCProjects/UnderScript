import * as settings from 'src/utils/settings/index';
import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import SettingType from 'src/utils/settings/types/setting';

wrap(() => {
  const name = 'settings';
  function add(plugin: UnderScriptPlugin, tab?: string): UnderScriptSettingsPage['add'] {
    const prefix = `underscript.plugin.${plugin.name}`;

    return (data: UnderScriptSettingOptions<any, any>) => {
      if (!data?.key) throw new Error('Key must be provided');

      const setting = {
        ...data,
        key: `${prefix}.${data.key}`,
        name: data.name || data.key,
        page: plugin,
        tab,
      };
      return settings.register(setting);
    };
  }

  function mod(plugin: UnderScriptPlugin) {
    const obj: UnderScriptSettings = {
      add: add(plugin),
      page(tabName) {
        if (typeof tabName !== 'string') throw new Error(`Page name must be a string, got ${typeof tabName}`);
        const tab = tabName.trim();
        if (!tab) throw new Error('Page name must be provided');
        return Object.freeze({
          add: add(plugin, tab),
          open: () => settings.open(plugin, tab),
        });
      },
      name(value) {
        if (typeof value !== 'string') throw new Error(`Name must be a string, got ${typeof value}`);
        const title = value.trim();
        if (!title) throw new Error('Name must be provided');
        return settings.setMainName(plugin, title);
      },
      on: (event: string, listener: (...args: any[]) => unknown) => settings.on(event, listener),
      open: () => settings.open(plugin),
      isOpen: () => settings.isOpen(),
      addType(type) {
        if (!(type instanceof SettingType)) {
          plugin.logger.error('SettingType: Attempted to register object of:', typeof type);
          return;
        }
        if (!type.name.startsWith(`${plugin.name}:`)) {
          type.name = `${plugin.name}:${type.name}`;
        }
        settings.registerType(type, plugin.addStyle);
      },
      value(key) {
        if (!settings.exists(key)) return undefined;
        return settings.value(key);
      },
    };
    return (): Readonly<UnderScriptSettings> => Object.freeze(obj);
  }

  registerModule(name, mod);
});
