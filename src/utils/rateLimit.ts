import type { Nullish } from 'src/types/utility';

const BASE_WAIT = 10;
const MAX_WAIT = 120;

function parseSeconds(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(seconds, 0);
  const date = Date.parse(`${value}`);
  return Number.isNaN(date) ? undefined : Math.max((date - Date.now()) / 1000, 0);
}

export function retryAfter(getHeader: (name: string) => unknown): number | undefined {
  return parseSeconds(getHeader('Retry-After')) ?? parseSeconds(getHeader('RateLimit-Reset'));
}

export function waitSeconds(requested: Nullish<number>, rateLimits: number): number {
  const wait = requested ?? BASE_WAIT * 2 ** (Math.max(rateLimits, 1) - 1);
  return Math.min(Math.max(Math.ceil(wait), 1), MAX_WAIT);
}

export function isRateLimited(status: number, getHeader: (name: string) => unknown): boolean {
  if (status === 429) return true;
  if (getHeader('cf-mitigated') != null) return true;
  return status === 503 && getHeader('Retry-After') != null;
}

export type RateLimiter = {
  active(): boolean;
  msLeft(): number;
  secondsLeft(): number;
  hit(requested?: Nullish<number>): void;
  ok(): void;
  reset(): void;
};

export function createRateLimiter(): RateLimiter {
  let until = 0;
  let hits = 0;

  const msLeft = () => Math.max(until - Date.now(), 0);

  return {
    active: () => msLeft() > 0,
    msLeft,
    secondsLeft: () => Math.ceil(msLeft() / 1000),
    hit(requested) {
      if (msLeft() === 0) hits += 1;
      until = Math.max(until, Date.now() + waitSeconds(requested, hits) * 1000);
    },
    ok() {
      hits = 0;
    },
    reset() {
      until = 0;
      hits = 0;
    },
  };
}
