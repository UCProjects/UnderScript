import { expect } from 'chai';
import { createRateLimiter, isRateLimited, retryAfter, waitSeconds } from '../../src/utils/rateLimit';
import installClock from '../setup/clock';

const headers = (values) => (name) => values[name] ?? null;

describe('retryAfter', () => {
  it('reads seconds', () => {
    expect(retryAfter(headers({ 'Retry-After': '12' }))).to.equal(12);
    expect(retryAfter(headers({ 'Retry-After': '0' }))).to.equal(0);
  });

  it('reads an HTTP date', () => {
    const seconds = retryAfter(headers({ 'Retry-After': new Date(Date.now() + 30000).toUTCString() }));
    expect(seconds).to.be.within(28, 31);
  });

  it('never goes below zero for a date in the past', () => {
    expect(retryAfter(headers({ 'Retry-After': new Date(Date.now() - 30000).toUTCString() }))).to.equal(0);
  });

  it('falls back to RateLimit-Reset', () => {
    expect(retryAfter(headers({ 'RateLimit-Reset': '7' }))).to.equal(7);
  });

  it('prefers Retry-After over RateLimit-Reset', () => {
    expect(retryAfter(headers({ 'Retry-After': '3', 'RateLimit-Reset': '9' }))).to.equal(3);
  });

  it('gives nothing when there is no usable header', () => {
    expect(retryAfter(headers({}))).to.equal(undefined);
    expect(retryAfter(headers({ 'Retry-After': '' }))).to.equal(undefined);
    expect(retryAfter(headers({ 'Retry-After': 'soon' }))).to.equal(undefined);
  });
});

describe('waitSeconds', () => {
  it('uses what the server asked for', () => {
    expect(waitSeconds(15, 1)).to.equal(15);
  });

  it('rounds up to a whole second', () => {
    expect(waitSeconds(2.2, 1)).to.equal(3);
  });

  it('waits at least a second', () => {
    expect(waitSeconds(0, 1)).to.equal(1);
    expect(waitSeconds(0.2, 1)).to.equal(1);
  });

  it('never waits more than two minutes', () => {
    expect(waitSeconds(3600, 1)).to.equal(120);
  });

  it('backs off 10, 20, 40, 80 and then stops at two minutes without a header', () => {
    const waits = [1, 2, 3, 4, 5, 6].map((rateLimits) => waitSeconds(undefined, rateLimits));
    expect(waits).to.deep.equal([10, 20, 40, 80, 120, 120]);
  });

  it('treats no strikes like the first', () => {
    expect(waitSeconds(undefined, 0)).to.equal(10);
  });
});

describe('isRateLimited', () => {
  const none = () => null;

  it('is true for a 429', () => {
    expect(isRateLimited(429, none)).to.equal(true);
  });

  it('is true when Cloudflare says it challenged the request', () => {
    expect(isRateLimited(403, headers({ 'cf-mitigated': 'challenge' }))).to.equal(true);
  });

  it('is true for a 503 that says when to come back', () => {
    expect(isRateLimited(503, headers({ 'Retry-After': '30' }))).to.equal(true);
  });

  it('is false for ordinary responses and failures', () => {
    expect(isRateLimited(200, none)).to.equal(false);
    expect(isRateLimited(403, none)).to.equal(false);
    expect(isRateLimited(502, none)).to.equal(false);
    expect(isRateLimited(503, none)).to.equal(false);
    expect(isRateLimited(200, headers({ 'Retry-After': '30' }))).to.equal(false);
  });
});

describe('createRateLimiter', () => {
  let clock;

  beforeEach(() => {
    clock = installClock();
  });

  afterEach(() => clock.restore());

  it('starts out not limited', () => {
    const limiter = createRateLimiter();
    expect(limiter.active()).to.equal(false);
    expect(limiter.secondsLeft()).to.equal(0);
    expect(limiter.msLeft()).to.equal(0);
  });

  it('waits as long as it was told', () => {
    const limiter = createRateLimiter();
    limiter.hit(12);
    expect(limiter.active()).to.equal(true);
    expect(limiter.secondsLeft()).to.equal(12);
    clock.tick(11999);
    expect(limiter.active()).to.equal(true);
    clock.tick(1);
    expect(limiter.active()).to.equal(false);
  });

  it('counts down in whole seconds, rounding up', () => {
    const limiter = createRateLimiter();
    limiter.hit(5);
    clock.tick(1500);
    expect(limiter.secondsLeft()).to.equal(4);
    expect(limiter.msLeft()).to.equal(3500);
  });

  it('backs off further each time it is hit again after a wait', () => {
    const limiter = createRateLimiter();
    limiter.hit();
    expect(limiter.secondsLeft()).to.equal(10);
    clock.tick(10000);
    limiter.hit();
    expect(limiter.secondsLeft()).to.equal(20);
    clock.tick(20000);
    limiter.hit();
    expect(limiter.secondsLeft()).to.equal(40);
  });

  it('does not back off further for several hits during the same wait', () => {
    const limiter = createRateLimiter();
    limiter.hit();
    limiter.hit();
    limiter.hit();
    expect(limiter.secondsLeft()).to.equal(10);
  });

  it('keeps the longest wait it has been given', () => {
    const limiter = createRateLimiter();
    limiter.hit(30);
    limiter.hit(5);
    expect(limiter.secondsLeft()).to.equal(30);
  });

  it('starts the backoff over after a request goes through', () => {
    const limiter = createRateLimiter();
    limiter.hit();
    clock.tick(10000);
    limiter.hit();
    clock.tick(20000);
    limiter.ok();
    limiter.hit();
    expect(limiter.secondsLeft()).to.equal(10);
  });

  it('can be reset', () => {
    const limiter = createRateLimiter();
    limiter.hit(60);
    limiter.reset();
    expect(limiter.active()).to.equal(false);
    limiter.hit();
    expect(limiter.secondsLeft()).to.equal(10);
  });
});
