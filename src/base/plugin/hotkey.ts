import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import Hotkey from 'src/utils/hotkey.class';
import { hotkeys } from 'src/utils/1.variables';

class PluginHotkey extends Hotkey {
  readonly plugin: UnderScriptPlugin;

  readonly hotkey: UnderScriptHotkey;

  constructor(plugin: UnderScriptPlugin, hotkey: UnderScriptHotkey) {
    super();
    this.plugin = plugin;
    this.hotkey = hotkey;
    Object.defineProperties(this, {
      name: { get: () => `[${hotkey.name}]` },
      keys: { get: () => hotkey.keys },
      clicks: { get: () => hotkey.clicks },
    });
  }

  run(event?: unknown, ...rest: unknown[]): unknown {
    try {
      return this.hotkey.run(event, ...rest);
    } catch (e) {
      this.plugin.logger.error(`Hotkey${this.name || ''}${e instanceof Error ? '' : ' Error:'}`, e);
    }
    return undefined;
  }
}

wrap(() => {
  const name = 'hotkey';
  function mod(plugin: UnderScriptPlugin): UnderScriptPluginHotkeys {
    const registry = new Map<UnderScriptHotkey, PluginHotkey>();
    return {
      register(hotkey) {
        validate(hotkey);
        if (registry.has(hotkey)) return;
        const wrapper = new PluginHotkey(plugin, hotkey);
        registry.set(hotkey, wrapper);
        hotkeys.push(wrapper);
      },
      unregister(hotkey) {
        validate(hotkey);
        const wrapper = registry.get(hotkey);
        if (!wrapper) return;
        registry.delete(hotkey);
        hotkeys.splice(hotkeys.indexOf(wrapper), 1);
      },
    };
  }

  registerModule(name, mod);
});

function validate(hotkey: UnderScriptHotkey): void {
  if (!(hotkey instanceof Hotkey)) throw new Error('Not valid hotkey');
}
