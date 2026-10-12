export const SESSION_REPLACED = 'Session replaced';

export function isSessionReplaced(reason: unknown): boolean {
  return reason === SESSION_REPLACED;
}

export type ReconnectPolicy = {
  gated: boolean;
  maxAttempts: number;
  delay(attempt: number): number;
  retries(code: number, reason?: unknown): boolean;
};

export type ReconnectState = {
  active: boolean;
  guest: boolean;
  attempts: number;
  closed: boolean;
};

const SECOND = 1000;
const MAX_DELAY = 30 * SECOND;

export function createPolicy(app: boolean, scriptClosed: number): ReconnectPolicy {
  if (!app) {
    return {
      gated: true,
      maxAttempts: 3,
      delay: (attempt) => SECOND * attempt,
      retries: (code, reason) => !isSessionReplaced(reason) && (code === 1000 || code === 1006),
    };
  }
  return {
    gated: false,
    maxAttempts: Infinity,
    delay: (attempt) => (attempt <= 0 ? 0 : Math.min(SECOND * 2 ** (attempt - 1), MAX_DELAY)),
    retries: (code, reason) => !isSessionReplaced(reason) && code !== scriptClosed,
  };
}

export function canReconnect(policy: ReconnectPolicy, state: ReconnectState): boolean {
  if (!state.closed || state.guest) return false;
  if (state.attempts > policy.maxAttempts) return false;
  return !policy.gated || state.active;
}

export type FlapGuard = {
  connected(now: number): void;
  closed(now: number): void;
  penalty(): number;
  reset(): void;
};

export function createFlapGuard({
  shortMs = 10 * SECOND,
  limit = 3,
  penalty = 60 * SECOND,
} = {}): FlapGuard {
  let connectedAt: number | null = null;
  let flaps = 0;
  return {
    connected(now) {
      connectedAt = now;
    },
    closed(now) {
      if (connectedAt === null) return;
      flaps = now - connectedAt < shortMs ? flaps + 1 : 0;
      connectedAt = null;
    },
    penalty() {
      return flaps >= limit ? penalty : 0;
    },
    reset() {
      connectedAt = null;
      flaps = 0;
    },
  };
}
