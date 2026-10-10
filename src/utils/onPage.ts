import wrap from './2.pokemon';
import * as api from './4.api';

export function getPageName(): string {
  const { pathname } = location;
  const length = pathname.length;
  let temp: number | null = pathname.indexOf('.');
  // eslint-disable-next-line no-cond-assign
  if (temp === -1 && (temp = pathname.lastIndexOf('/')) <= 0) {
    temp = null;
  }
  return pathname.substring(1, temp || length);
}

export default function onPage(name: string, callback?: () => unknown, prefix?: string): boolean {
  const r = getPageName() === name;
  if (typeof callback === 'function' && r) {
    wrap(callback, prefix);
  }
  return r;
}

api.register('onPage', onPage);
