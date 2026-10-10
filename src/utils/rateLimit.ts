import type { Nullish } from 'src/types/utility';

const BASE_WAIT = 10;
const MAX_WAIT = 120;

function parseSeconds(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(seconds, 0);
  const date = Date.parse(String(value));
  return Number.isNaN(date) ? undefined : Math.max((date - Date.now()) / 1000, 0);
}

export function retryAfter(getHeader: (name: string) => unknown): number | undefined {
  return parseSeconds(getHeader('Retry-After')) ?? parseSeconds(getHeader('RateLimit-Reset'));
}

export function waitSeconds(requested: Nullish<number>, rateLimits: number): number {
  const wait = requested ?? BASE_WAIT * 2 ** (Math.max(rateLimits, 1) - 1);
  return Math.min(Math.max(Math.ceil(wait), 1), MAX_WAIT);
}
