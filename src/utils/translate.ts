import type Translation from 'src/structures/constants/translation';
import { window } from './1.variables';
import { global } from './global';
import toLocale from './toLocale';

type TranslateOptions = {
  args?: string[];
  fallback?: string | Translation;
  locale?: string;
};

export default (element: string | Element | JQuery): JQuery => {
  const target = element instanceof $ ? element as JQuery : $(element as Element);
  if (typeof $.i18n !== 'undefined') {
    global('translateElement')(target);
  }
  return target;
};

export function translateText(text: string | Translation, {
  args = [],
  fallback = text,
  locale,
}: TranslateOptions = {}): string {
  if (typeof window.$?.i18n === 'function') {
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
