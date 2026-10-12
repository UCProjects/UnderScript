import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import { toast as basicToast, errorToast } from 'src/utils/2.toasts';
import toArray from 'src/utils/toArray';

wrap(() => {
  const buildFooter = (plugin, text) => [text, plugin.name, 'via UnderScript'].filter(Boolean).join(' • ');
  const name = 'toast';
  /**
   * @param {*} plugin
   * @param {import('simpletoast').SimpleToastOptions} options
   * @returns {import('simpletoast').SimpleToastHandle}
   */
  function pluginToast(plugin, options) {
    const footer = buildFooter(plugin, options.footer);
    const toast = { ...options, footer };
    if (toast.error) return errorToast(toast);
    return basicToast(toast);
  }

  function mod(plugin) {
    const warned = new Set();
    function warn(key, message) {
      if (warned.has(key)) return;
      warned.add(key);
      plugin.logger.warn(message);
    }

    return (data) => {
      const options = typeof data === 'object' ? { ...data } : { text: data };
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
