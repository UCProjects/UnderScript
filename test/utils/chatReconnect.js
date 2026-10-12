import { expect } from 'chai';
import {
  canReconnect,
  createFlapGuard,
  createPolicy,
  isSessionReplaced,
} from '../../src/utils/chatReconnect';

const CLOSED_BY_SCRIPT = 3500;
const open = { active: true, guest: false, attempts: 0, closed: true };

describe('browser reconnect policy', () => {
  const policy = createPolicy(false, CLOSED_BY_SCRIPT);

  it('only retries the codes it always has', () => {
    expect(policy.retries(1000)).to.equal(true);
    expect(policy.retries(1006)).to.equal(true);
    expect(policy.retries(1001)).to.equal(false);
    expect(policy.retries(CLOSED_BY_SCRIPT)).to.equal(false);
  });

  it('waits a second longer after each failure', () => {
    expect([0, 1, 2, 3].map((attempt) => policy.delay(attempt))).to.deep.equal([0, 1000, 2000, 3000]);
  });

  it('gives up after three failures', () => {
    expect(canReconnect(policy, { ...open, attempts: 3 })).to.equal(true);
    expect(canReconnect(policy, { ...open, attempts: 4 })).to.equal(false);
  });

  it('needs the window to own the session', () => {
    expect(canReconnect(policy, { ...open, active: false })).to.equal(false);
  });
});

describe('session replaced', () => {
  it('recognises the reason the server sends', () => {
    expect(isSessionReplaced('Session replaced')).to.equal(true);
    expect(isSessionReplaced('')).to.equal(false);
    expect(isSessionReplaced(undefined)).to.equal(false);
  });

  it('is never retried, whatever the code', () => {
    [false, true].forEach((app) => {
      const policy = createPolicy(app, CLOSED_BY_SCRIPT);
      expect(policy.retries(1000, 'Session replaced')).to.equal(false);
      expect(policy.retries(1000, '')).to.equal(true);
    });
  });
});

describe('app reconnect policy', () => {
  const policy = createPolicy(true, CLOSED_BY_SCRIPT);

  it('retries every close except the one the script made', () => {
    expect(policy.retries(1000)).to.equal(true);
    expect(policy.retries(1001)).to.equal(true);
    expect(policy.retries(1012)).to.equal(true);
    expect(policy.retries(CLOSED_BY_SCRIPT)).to.equal(false);
  });

  it('retries at once, then backs off up to thirty seconds', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 20].map((attempt) => policy.delay(attempt))).to.deep.equal([
      0, 1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000,
    ]);
  });

  it('never gives up and ignores which window is active', () => {
    expect(canReconnect(policy, { ...open, attempts: 500, active: false })).to.equal(true);
  });

  it('still stops in guest mode and while the socket is not closed', () => {
    expect(canReconnect(policy, { ...open, guest: true })).to.equal(false);
    expect(canReconnect(policy, { ...open, closed: false })).to.equal(false);
  });
});

describe('flap guard', () => {
  it('starts without a penalty', () => {
    expect(createFlapGuard().penalty()).to.equal(0);
  });

  it('adds the penalty after three short-lived connections in a row', () => {
    const guard = createFlapGuard();
    [0, 1000, 2000].forEach((start) => {
      guard.connected(start);
      guard.closed(start + 2000);
    });
    expect(guard.penalty()).to.equal(60000);
  });

  it('is not triggered by failed attempts that never connected', () => {
    const guard = createFlapGuard();
    for (let i = 0; i < 10; i += 1) guard.closed(i * 1000);
    expect(guard.penalty()).to.equal(0);
  });

  it('forgets a streak once a connection lasts', () => {
    const guard = createFlapGuard();
    [0, 1000].forEach((start) => {
      guard.connected(start);
      guard.closed(start + 2000);
    });
    guard.connected(10000);
    guard.closed(100000);
    expect(guard.penalty()).to.equal(0);
    guard.connected(110000);
    guard.closed(112000);
    expect(guard.penalty()).to.equal(0);
  });

  it('clears the penalty on reset', () => {
    const guard = createFlapGuard({ limit: 1 });
    guard.connected(0);
    guard.closed(1000);
    expect(guard.penalty()).to.equal(60000);
    guard.reset();
    expect(guard.penalty()).to.equal(0);
  });
});
