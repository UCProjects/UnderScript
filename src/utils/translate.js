import { window } from './1.variables.js';
import { global } from './global.js';
import toLocale from './toLocale.js';

export default (element) => {
  element = element instanceof $ ? element : $(element);
  if ($.i18n) {
    global('translateElement')(element);
  }
  return element;
};

/**
 * @param {string} text text to translate
 * @param {object} options
 * @param {string[]} [options.args] argument array to pass to translation function
 * @param {string} [options.fallback] value to return when missing or translation not loaded
 * @param {string} [options.locale] locale to switch to
 * @returns {string} either translated text or fallback value
 */
export function translateText(text, {
  args = [],
  fallback = text,
  locale,
} = {}) {
  if (window.$?.i18n) {
    const string = `${text}`;
    const val = (() => {
      if (locale && $.i18n().locale !== locale) {
        const temp = toLocale({
          id: string,
          data: args,
          locale,
        });
        if (temp === 'ERROR') {
          return string;
        }
        return temp;
      }
      return $.i18n(string, ...args);
    })();
    if (val !== string) return val;
  }
  return `${fallback}`;
}
