import { expect } from 'chai';
import runQueue from '../../src/utils/workQueue';
import installClock from '../setup/clock';

const flush = () => new Promise((resolve) => { setImmediate(resolve); });

const ok = (value) => ({ type: 'ok', value });
const skip = () => ({ type: 'skip' });
const retry = () => ({ type: 'retry' });
const limited = (retryAfter) => ({ type: 'limited', retryAfter });

function controlled() {
  const calls = [];
  const attempt = (item) => new Promise((resolve, reject) => {
    calls.push({ item, resolve, reject });
  });
  const open = () => calls.filter((call) => !call.done);
  const settle = async (call, outcome) => {
    call.done = true;
    call.resolve(outcome);
    await flush();
  };
  return { calls, attempt, open, settle };
}

describe('runQueue', () => {
  let clock;

  beforeEach(() => {
    clock = installClock();
  });

  afterEach(() => clock.restore());

  describe('concurrency', () => {
    it('starts at most five at a time', async () => {
      const work = controlled();
      runQueue({ items: Array.from({ length: 12 }, (_, i) => i), attempt: work.attempt });
      await flush();
      expect(work.open()).to.have.length(5);
    });

    it('starts the next as soon as one finishes', async () => {
      const work = controlled();
      runQueue({ items: Array.from({ length: 12 }, (_, i) => i), attempt: work.attempt });
      await flush();
      await work.settle(work.open()[0], ok());
      expect(work.open()).to.have.length(5);
      expect(work.calls).to.have.length(6);
    });

    it('uses the concurrency it is given', async () => {
      const work = controlled();
      runQueue({ items: [1, 2, 3, 4, 5, 6], attempt: work.attempt, concurrency: 2 });
      await flush();
      expect(work.open()).to.have.length(2);
    });

    it('never has more in flight than allowed', async () => {
      const work = controlled();
      let peak = 0;
      const run = runQueue({
        items: Array.from({ length: 20 }, (_, i) => i),
        attempt: work.attempt,
        onChange: ({ inFlight }) => { peak = Math.max(peak, inFlight); },
      });
      await flush();
      while (work.open().length) {
        // eslint-disable-next-line no-await-in-loop
        await work.settle(work.open()[0], ok());
      }
      const result = await run.promise;
      expect(result.done).to.equal(20);
      expect(peak).to.be.at.most(5);
    });
  });

  describe('results', () => {
    it('resolves with the counts when everything is done', async () => {
      const work = controlled();
      const run = runQueue({ items: [1, 2, 3], attempt: work.attempt });
      await flush();
      await Promise.all(work.open().map((call) => work.settle(call, ok())));
      const result = await run.promise;
      expect(result).to.include({ total: 3, done: 3, skipped: 0, failed: 0, stopped: false, abandoned: 0 });
    });

    it('resolves straight away when there is nothing to do', async () => {
      const result = await runQueue({ items: [], attempt: () => Promise.resolve(ok()) }).promise;
      expect(result).to.include({ total: 0, done: 0 });
    });

    it('hands every success to onOk with its item', async () => {
      const seen = [];
      const run = runQueue({
        items: ['a', 'b', 'c'],
        attempt: (item) => Promise.resolve(ok(item.toUpperCase())),
        onOk: (item, value) => seen.push([item, value]),
      });
      await run.promise;
      expect(seen).to.have.deep.members([['a', 'A'], ['b', 'B'], ['c', 'C']]);
    });

    it('keeps going when onOk throws', async () => {
      const original = console.error;
      console.error = () => {};
      try {
        const run = runQueue({
          items: [1, 2],
          attempt: () => Promise.resolve(ok()),
          onOk: () => { throw new Error('boom'); },
        });
        expect(await run.promise).to.include({ done: 2 });
      } finally {
        console.error = original;
      }
    });

    it('reports changes as they happen', async () => {
      const states = [];
      const run = runQueue({
        items: [1, 2],
        attempt: () => Promise.resolve(ok()),
        onChange: (state) => states.push(state),
      });
      await run.promise;
      expect(states.length).to.be.greaterThan(0);
      expect(states[states.length - 1].done).to.equal(2);
    });
  });

  describe('skipped and failed', () => {
    it('counts a skip and does not try it again', async () => {
      const work = controlled();
      const run = runQueue({ items: [1], attempt: work.attempt });
      await flush();
      await work.settle(work.open()[0], skip());
      expect(await run.promise).to.include({ skipped: 1, done: 0, failed: 0 });
      expect(work.calls).to.have.length(1);
    });

    it('tries a failure again up to three more times, then gives up on it', async () => {
      const work = controlled();
      const run = runQueue({ items: ['x'], attempt: work.attempt });
      for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await flush();
        // eslint-disable-next-line no-await-in-loop
        await work.settle(work.open()[0], retry());
      }
      expect(await run.promise).to.include({ failed: 1, done: 0 });
      expect(work.calls).to.have.length(4);
    });

    it('treats a rejected attempt as a failure to try again', async () => {
      let tries = 0;
      const run = runQueue({
        items: ['x'],
        attempt: () => {
          tries += 1;
          return tries < 3 ? Promise.reject(new Error('network')) : Promise.resolve(ok());
        },
      });
      expect(await run.promise).to.include({ done: 1, failed: 0 });
      expect(tries).to.equal(3);
    });

    it('lets a retry that works count as done', async () => {
      let tries = 0;
      const run = runQueue({
        items: ['x'],
        attempt: () => {
          tries += 1;
          return Promise.resolve(tries === 1 ? retry() : ok());
        },
      });
      expect(await run.promise).to.include({ done: 1, failed: 0 });
    });
  });

  describe('rate limits', () => {
    it('puts a limited item back and waits before sending anything', async () => {
      const work = controlled();
      runQueue({ items: [1, 2, 3], attempt: work.attempt, concurrency: 1 });
      await flush();
      await work.settle(work.open()[0], limited(30));
      expect(work.calls).to.have.length(1);
      clock.tick(29000);
      await flush();
      expect(work.calls).to.have.length(1);
      clock.tick(1000);
      await flush();
      expect(work.calls).to.have.length(2);
      expect(work.calls[1].item).to.equal(1);
    });

    it('does not count a limited attempt against its retries', async () => {
      const work = controlled();
      const run = runQueue({ items: ['x'], attempt: work.attempt, retries: 1 });
      for (let i = 0; i < 4; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await flush();
        // eslint-disable-next-line no-await-in-loop
        await work.settle(work.open()[0], limited(1));
        clock.tick(1000);
      }
      await flush();
      await work.settle(work.open()[0], ok());
      expect(await run.promise).to.include({ done: 1, failed: 0 });
    });

    it('backs off 10 seconds, then 20, when it is not told how long', async () => {
      const work = controlled();
      runQueue({ items: [1], attempt: work.attempt, concurrency: 1 });
      await flush();
      await work.settle(work.open()[0], limited());
      clock.tick(9999);
      await flush();
      expect(work.calls).to.have.length(1);
      clock.tick(1);
      await flush();
      expect(work.calls).to.have.length(2);
      await work.settle(work.open()[0], limited());
      clock.tick(19999);
      await flush();
      expect(work.calls).to.have.length(2);
      clock.tick(1);
      await flush();
      expect(work.calls).to.have.length(3);
    });

    it('says how long it is waiting', async () => {
      const work = controlled();
      const run = runQueue({ items: [1], attempt: work.attempt, concurrency: 1 });
      await flush();
      await work.settle(work.open()[0], limited(12));
      expect(run.state().waitSeconds).to.equal(12);
      clock.tick(5000);
      expect(run.state().waitSeconds).to.equal(7);
    });

    it('lets the requests already out finish while it waits', async () => {
      const work = controlled();
      const run = runQueue({ items: [1, 2, 3], attempt: work.attempt, concurrency: 3 });
      await flush();
      const [first, second, third] = work.open();
      await work.settle(first, limited(10));
      await work.settle(second, ok());
      await work.settle(third, ok());
      expect(run.state().done).to.equal(2);
      expect(work.calls).to.have.length(3);
    });
  });

  describe('stopping', () => {
    it('does not start anything new', async () => {
      const work = controlled();
      const run = runQueue({ items: [1, 2, 3, 4, 5, 6, 7], attempt: work.attempt });
      await flush();
      run.stop();
      await work.settle(work.open()[0], ok());
      expect(work.calls).to.have.length(5);
    });

    it('waits for what is already out, then resolves', async () => {
      const work = controlled();
      const run = runQueue({ items: Array.from({ length: 8 }, (_, i) => i), attempt: work.attempt });
      await flush();
      run.stop();
      await Promise.all(work.open().map((call) => work.settle(call, ok())));
      const result = await run.promise;
      expect(result).to.include({ stopped: true, done: 5, queued: 3, abandoned: 0 });
    });

    it('resolves at once when nothing is out', async () => {
      const work = controlled();
      const run = runQueue({ items: [1, 2], attempt: work.attempt, concurrency: 1 });
      await flush();
      await work.settle(work.open()[0], limited(60));
      run.stop();
      expect(await run.promise).to.include({ stopped: true, done: 0, queued: 2 });
    });

    it('gives up after five seconds without an answer', async () => {
      const work = controlled();
      const run = runQueue({ items: [1, 2, 3], attempt: work.attempt });
      await flush();
      await work.settle(work.open()[0], ok());
      run.stop();
      clock.tick(4900);
      await flush();
      let resolved = false;
      run.promise.then(() => { resolved = true; });
      await flush();
      expect(resolved).to.equal(false);
      clock.tick(200);
      await flush();
      const result = await run.promise;
      expect(result).to.include({ stopped: true, done: 1, abandoned: 2 });
    });

    it('starts the five seconds over with each answer', async () => {
      const work = controlled();
      const run = runQueue({ items: [1, 2, 3], attempt: work.attempt });
      await flush();
      run.stop();
      clock.tick(4000);
      await work.settle(work.open()[0], ok());
      clock.tick(4000);
      await flush();
      let resolved = false;
      run.promise.then(() => { resolved = true; });
      await flush();
      expect(resolved).to.equal(false);
      clock.tick(1500);
      await flush();
      expect(await run.promise).to.include({ done: 1, abandoned: 2 });
    });

    it('still hands over an answer that arrives after it gave up', async () => {
      const work = controlled();
      const seen = [];
      const run = runQueue({
        items: [1, 2],
        attempt: work.attempt,
        onOk: (item) => seen.push(item),
      });
      await flush();
      run.stop();
      clock.tick(5200);
      await flush();
      await run.promise;
      await work.settle(work.calls[0], ok());
      expect(seen).to.deep.equal([1]);
    });
  });
});
