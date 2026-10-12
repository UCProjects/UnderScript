import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import { toast as basicToast, errorToast } from 'src/utils/2.toasts';
import toArray from 'src/utils/toArray';

wrap(() => {
  const buildFooter = (plugin: UnderScriptPlugin, text?: string) => [text, plugin.name, 'via UnderScript'].filter(Boolean).join(' • ');
  const name = 'toast';

  function pluginToast(plugin: UnderScriptPlugin, options: UnderScriptToastOptions): UnderScriptToast {
    const footer = buildFooter(plugin, options.footer);
    const toast = { ...options, footer };
    const created = toast.error ? errorToast(toast) : basicToast(toast);
    if (!created) throw new Error('Toast was not created');
    return created;
  }

  function mod(plugin: UnderScriptPlugin) {
    const warned = new Set<string>();
    function warn(key: string, message: string) {
      if (warned.has(key)) return;
      warned.add(key);
      plugin.logger.warn(message);
    }

    return (data: string | UnderScriptToastOptions): UnderScriptToast => {
      const options: UnderScriptToastOptions = typeof data === 'object' ? { ...data } : { text: data };
      const buttons = toArray(options.buttons);
      if (options.css || buttons.some((button) => button?.css)) {
        warn('css', 'toast(): `css` is deprecated, please use `className` instead.');
      }
      if (buttons.some((button) => button?.onclick)) {
        warn('onclick', 'toast(): `onclick` is deprecated, please use `onClick` instead.');
      }
      const toast = pluginToast(plugin, options);
      if (!toast.exists()) return toast;
      const { setFooter } = toast;
      toast.setFooter = (text) => setFooter(buildFooter(plugin, text));
      return toast;
    };
  }

  registerModule(name, mod, 'logger');
});
