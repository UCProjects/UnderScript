import { expect } from 'chai';
import LazyStore from 'src/utils/LazyStore';

describe('LazyStore', () => {
  function counting(value = 'result') {
    let calls = 0;
    const store = new LazyStore(() => {
      calls += 1;
      return `${value}${calls}`;
    });
    return { store, calls: () => calls };
  }

  it('does not run the function until it is read', () => {
    const { calls } = counting();
    expect(calls()).to.equal(0);
  });

  it('runs the function once and keeps the result', () => {
    const { store, calls } = counting();
    expect(store.get()).to.equal('result1');
    expect(store.value).to.equal('result1');
    expect(store.get()).to.equal('result1');
    expect(calls()).to.equal(1);
  });

  it('reports whether it has loaded', () => {
    const { store } = counting();
    expect(store.isLoaded()).to.equal(false);
    store.get();
    expect(store.isLoaded()).to.equal(true);
  });

  it('runs the function again after a reset', () => {
    const { store, calls } = counting();
    store.get();
    store.reset();
    expect(store.isLoaded()).to.equal(false);
    expect(calls()).to.equal(1);
    expect(store.get()).to.equal('result2');
    expect(calls()).to.equal(2);
  });

  it('does not run anything when reset before the first read', () => {
    const { store, calls } = counting();
    store.reset();
    expect(calls()).to.equal(0);
  });

  it('keeps a result that is undefined or falsy', () => {
    [undefined, null, 0, '', false].forEach((value) => {
      let calls = 0;
      const store = new LazyStore(() => {
        calls += 1;
        return value;
      });
      expect(store.get()).to.equal(value);
      expect(store.get()).to.equal(value);
      expect(calls).to.equal(1);
    });
  });

  it('tries again when the function throws', () => {
    let calls = 0;
    const store = new LazyStore(() => {
      calls += 1;
      if (calls === 1) throw new Error('not yet');
      return 'ready';
    });
    expect(() => store.get()).to.throw('not yet');
    expect(store.isLoaded()).to.equal(false);
    expect(store.get()).to.equal('ready');
    expect(calls).to.equal(2);
  });

  it('needs a function', () => {
    expect(() => new LazyStore()).to.throw(TypeError);
    expect(() => new LazyStore('value')).to.throw(TypeError);
  });

  describe('with promises', () => {
    function deferred() {
      let resolve;
      let reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    function pending() {
      const requests = [];
      const store = new LazyStore(() => {
        const request = deferred();
        requests.push(request);
        return request.promise;
      });
      return { store, requests };
    }

    const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });

    it('shares one request between callers', async () => {
      const { store, requests } = pending();
      const first = store.get();
      const second = store.value;
      expect(second).to.equal(first);
      expect(requests).to.have.length(1);
      requests[0].resolve('data');
      expect(await first).to.equal('data');
    });

    it('is loaded once the promise resolves, not before', async () => {
      const { store, requests } = pending();
      store.get();
      expect(store.isLoaded()).to.equal(false);
      requests[0].resolve('data');
      await tick();
      expect(store.isLoaded()).to.equal(true);
    });

    it('does not cache a rejection', async () => {
      const { store, requests } = pending();
      const first = store.get();
      requests[0].reject(new Error('offline'));
      let error;
      try {
        await first;
      } catch (e) {
        error = e;
      }
      expect(error.message).to.equal('offline');
      await tick();
      expect(store.isLoaded()).to.equal(false);
      expect(store.get()).to.not.equal(first);
      expect(requests).to.have.length(2);
    });

    it('ignores a request that finishes after a reset', async () => {
      const { store, requests } = pending();
      store.get();
      store.reset();
      const second = store.get();
      requests[0].resolve('stale');
      await tick();
      expect(store.isLoaded()).to.equal(false);
      expect(store.get()).to.equal(second);
      requests[1].resolve('fresh');
      await tick();
      expect(store.isLoaded()).to.equal(true);
      expect(await store.get()).to.equal('fresh');
      expect(requests).to.have.length(2);
    });

    it('does not let a stale rejection clear a newer request', async () => {
      const { store, requests } = pending();
      const stale = store.get();
      stale.catch(() => {});
      store.reset();
      const current = store.get();
      requests[0].reject(new Error('old'));
      await tick();
      expect(store.get()).to.equal(current);
      expect(requests).to.have.length(2);
    });
  });
});
