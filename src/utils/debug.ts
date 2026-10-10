import type { DebugFlag } from './debugFlags';
import { all, general } from './debugFlags';

export function debug(message: unknown, flag: DebugFlag = general, ...extras: unknown[]): void {
  if (!enabled(flag)) return;
  console.debug(`[${flag.key}]`, message, ...extras);
}

export function enabled(flag: DebugFlag): boolean {
  return value(flag.key) || value(all.key);
}

function value(key: string): boolean {
  const val = localStorage.getItem(key);
  return val === '1' || val === 'true';
}
