import type { Nullish } from 'src/types/utility';
import Counter from './Counter';
import { createRateLimiter } from './rateLimit';

export type Attempt<R> =
  | { type: 'ok'; value: R }
  | { type: 'skip' }
  | { type: 'retry' }
  | { type: 'limited'; retryAfter?: Nullish<number> };

export type QueueState = {
  total: number;
  done: number;
  skipped: number;
  failed: number;
  queued: number;
  inFlight: number;
  waitSeconds: number;
  stopping: boolean;
};

export type QueueResult = QueueState & {
  stopped: boolean;
  abandoned: number;
};

export type QueueOptions<T, R> = {
  items: ReadonlyArray<T>;
  attempt(item: T): Promise<Attempt<R>>;
  concurrency?: number;
  retries?: number;
  silence?: number;
  onOk?(item: T, value: R): void;
  onChange?(state: QueueState): void;
};

export type QueueRun = {
  promise: Promise<QueueResult>;
  stop(): void;
  state(): QueueState;
};

const TICK = 200;

export default function runQueue<T, R>({
  items,
  attempt,
  concurrency = 5,
  retries = 3,
  silence = 5000,
  onOk,
  onChange,
}: QueueOptions<T, R>): QueueRun {
  const limiter = createRateLimiter();
  const queue = items.map((item) => ({ item, failures: 0 }));
  const total = queue.length;
  const inFlight = new Counter();
  const done = new Counter();
  const skipped = new Counter();
  const failed = new Counter();
  let stopped = false;
  let finished = false;
  let lastActivity = Date.now();
  let timer = 0;
  let resolve: (result: QueueResult) => void = () => {};

  const promise = new Promise<QueueResult>((res) => {
    resolve = res;
  });

  function state(): QueueState {
    return {
      total,
      done: done.value,
      skipped: skipped.value,
      failed: failed.value,
      queued: queue.length,
      inFlight: inFlight.value,
      waitSeconds: limiter.secondsLeft(),
      stopping: stopped,
    };
  }

  function emit() {
    onChange?.(state());
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    resolve({ ...state(), stopped, abandoned: inFlight.value });
  }

  function schedule(ms: number) {
    clearTimeout(timer);
    timer = setTimeout(pump, ms) as unknown as number;
  }

  function settle(entry: { item: T; failures: number }, outcome: Attempt<R>) {
    inFlight.remove();
    lastActivity = Date.now();
    if (outcome.type === 'ok') {
      limiter.ok();
      done.next();
      try {
        onOk?.(entry.item, outcome.value);
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    }
    if (finished) return;
    switch (outcome.type) {
      case 'skip':
        skipped.next();
        break;
      case 'limited':
        limiter.hit(outcome.retryAfter);
        queue.unshift(entry);
        break;
      case 'retry':
        entry.failures += 1;
        if (entry.failures > retries) {
          failed.next();
        } else {
          queue.push(entry);
        }
        break;
      default:
    }
    emit();
    pump();
  }

  function start(entry: { item: T; failures: number }) {
    inFlight.next();
    Promise.resolve()
      .then(() => attempt(entry.item))
      .catch((): Attempt<R> => ({ type: 'retry' }))
      .then((outcome) => settle(entry, outcome));
  }

  function pump() {
    if (finished) return;
    if (stopped) {
      if (!inFlight.value || Date.now() - lastActivity >= silence) {
        finish();
        return;
      }
      emit();
      schedule(TICK);
      return;
    }
    if (!queue.length && !inFlight.value) {
      finish();
      return;
    }
    if (limiter.active()) {
      emit();
      schedule(Math.min(1000, limiter.msLeft()));
      return;
    }
    while (inFlight.value < concurrency && queue.length && !limiter.active()) {
      start(queue.shift() as { item: T; failures: number });
    }
    if (queue.length || inFlight.value) emit();
  }

  function stop() {
    if (finished || stopped) return;
    stopped = true;
    lastActivity = Date.now();
    emit();
    pump();
  }

  pump();

  return { promise, stop, state };
}
