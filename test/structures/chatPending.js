import { expect } from 'chai';
import installClock from '../setup/clock';
import {
  arm,
  claim,
  createPending,
  echoed,
  forgetAll,
  refused,
  submitted,
} from '../../src/structures/chat/pending';

const flush = () => new Promise((resolve) => { setImmediate(resolve); });
const channel = (id, type = 'public') => ({ type, id: `${id}`, room: `chat-${type}-${id}` });
const message = (where, authorId = 7) => ({ id: 1, channel: where, author: { id: authorId }, text: 'hi' });
const notice = { kind: 'error', key: 'chat-spam-protection', args: [3], text: 'Slow down' };

describe('pending chat sends', () => {
  let clock;

  const track = (where) => {
    const pending = createPending();
    const seen = { status: undefined, result: undefined };
    pending.promise.then((result) => {
      seen.status = result.status;
      seen.result = result;
    });
    arm(where, pending);
    submitted(where, claim(where));
    return seen;
  };

  beforeEach(() => {
    clock = installClock();
  });

  afterEach(() => {
    clock.tick(60000);
    forgetAll();
    clock.restore();
  });

  it('settles as sent when the message comes back from its author', async () => {
    const room = channel(1);
    const seen = track(room);
    const echo = message(room);
    echoed(echo, 7);
    await flush();
    expect(seen.status).to.equal('sent');
    expect(seen.result.message).to.equal(echo);
  });

  it('compares the author and the user as text, since the game keeps one as a number', async () => {
    const room = channel(1);
    const seen = track(room);
    echoed(message(room, '7'), 7);
    await flush();
    expect(seen.status).to.equal('sent');
  });

  it('ignores a message from someone else', async () => {
    const room = channel(1);
    const seen = track(room);
    echoed(message(room, 8), 7);
    await flush();
    expect(seen.status).to.equal(undefined);
  });

  it('ignores a message from a room nothing was sent to', async () => {
    const seen = track(channel(1));
    echoed(message(channel(2)), 7);
    await flush();
    expect(seen.status).to.equal(undefined);
  });

  it('tells a public room from a private chat with the same id', async () => {
    const seen = track(channel(1, 'private'));
    echoed(message(channel(1, 'public')), 7);
    await flush();
    expect(seen.status).to.equal(undefined);
    echoed(message(channel(1, 'private')), 7);
    await flush();
    expect(seen.status).to.equal('sent');
  });

  it('settles the oldest send of a room first', async () => {
    const room = channel(1);
    const first = track(room);
    const second = track(room);
    echoed(message(room), 7);
    await flush();
    expect(first.status).to.equal('sent');
    expect(second.status).to.equal(undefined);
    echoed(message(room), 7);
    await flush();
    expect(second.status).to.equal('sent');
  });

  it('settles a send in the room it was echoed in, not an older send somewhere else', async () => {
    const first = track(channel(1));
    const second = track(channel(2));
    echoed(message(channel(2)), 7);
    await flush();
    expect(first.status).to.equal(undefined);
    expect(second.status).to.equal('sent');
  });

  it('counts a send nobody is waiting on, so the others stay in order', async () => {
    const room = channel(1);
    submitted(room, claim(room));
    const waited = track(room);
    echoed(message(room), 7);
    await flush();
    expect(waited.status).to.equal(undefined);
    echoed(message(room), 7);
    await flush();
    expect(waited.status).to.equal('sent');
  });

  it('settles the oldest send as rejected when the server refuses', async () => {
    const first = track(channel(1));
    const second = track(channel(2));
    refused(notice);
    await flush();
    expect(first.status).to.equal('rejected');
    expect(first.result.notice).to.equal(notice);
    expect(second.status).to.equal(undefined);
  });

  it('does nothing when it is refused and nothing is waiting', () => {
    expect(() => refused(notice)).to.not.throw();
  });

  it('settles as unconfirmed after five seconds', async () => {
    const seen = track(channel(1));
    clock.tick(4999);
    await flush();
    expect(seen.status).to.equal(undefined);
    clock.tick(1);
    await flush();
    expect(seen.status).to.equal('unconfirmed');
  });

  it('forgets a send that timed out, so a later message settles the next one', async () => {
    const room = channel(1);
    const first = track(room);
    clock.tick(5000);
    const second = track(room);
    echoed(message(room), 7);
    await flush();
    expect(first.status).to.equal('unconfirmed');
    expect(second.status).to.equal('sent');
  });

  it('keeps the first thing that happened to a send', async () => {
    const room = channel(1);
    const seen = track(room);
    echoed(message(room), 7);
    clock.tick(5000);
    refused(notice);
    await flush();
    expect(seen.status).to.equal('sent');
  });

  it('settles everything waiting as unconfirmed when asked to forget', async () => {
    const first = track(channel(1));
    const second = track(channel(2, 'private'));
    forgetAll();
    await flush();
    expect(first.status).to.equal('unconfirmed');
    expect(second.status).to.equal('unconfirmed');
  });

  describe('a send that was armed', () => {
    it('settles as canceled when nothing is sent right after', async () => {
      const pending = createPending();
      let status;
      pending.promise.then((result) => { status = result.status; });
      arm(channel(1), pending);
      clock.tick(0);
      await flush();
      expect(status).to.equal('canceled');
    });

    it('is not canceled once the message goes out', async () => {
      const pending = createPending();
      let status;
      pending.promise.then((result) => { status = result.status; });
      arm(channel(1), pending);
      submitted(channel(1), claim(channel(1)));
      clock.tick(0);
      await flush();
      expect(status).to.equal(undefined);
    });

    it('is not taken by a send to another room', async () => {
      const pending = createPending();
      let status;
      pending.promise.then((result) => { status = result.status; });
      arm(channel(1), pending);
      submitted(channel(2), claim(channel(2)));
      clock.tick(0);
      await flush();
      expect(status).to.equal('canceled');
    });

    it('is only taken by the first send to its room', async () => {
      const room = channel(1);
      const pending = createPending();
      let status;
      pending.promise.then((result) => { status = result.status; });
      arm(room, pending);
      submitted(room, claim(room));
      submitted(room, claim(room));
      echoed(message(room), 7);
      await flush();
      expect(status).to.equal('sent');
    });
  });

  describe('a claim', () => {
    it('is the armed send when it is for the same room', () => {
      const pending = createPending();
      arm(channel(1), pending);
      expect(claim(channel(1))).to.equal(pending);
    });

    it('is a new send when nothing was armed for its room', () => {
      const pending = createPending();
      arm(channel(1), pending);
      expect(claim(channel(2))).to.not.equal(pending);
    });

    it('settles as unconfirmed when the message is never written', async () => {
      const taken = claim(channel(1));
      let status;
      taken.promise.then((result) => { status = result.status; });
      clock.tick(29999);
      await flush();
      expect(status).to.equal(undefined);
      clock.tick(1);
      await flush();
      expect(status).to.equal('unconfirmed');
    });

    it('is not settled early when the message is written after a wait', async () => {
      const room = channel(1);
      const taken = claim(room);
      let status;
      taken.promise.then((result) => { status = result.status; });
      clock.tick(20000);
      submitted(room, taken);
      clock.tick(4000);
      echoed(message(room), 7);
      await flush();
      expect(status).to.equal('sent');
    });

    it('stops its long wait once the message is written', async () => {
      const room = channel(1);
      const taken = claim(room);
      let status;
      taken.promise.then((result) => { status = result.status; });
      submitted(room, taken);
      echoed(message(room), 7);
      clock.tick(60000);
      await flush();
      expect(status).to.equal('sent');
    });
  });

  describe('arming over a send that was armed', () => {
    it('cancels the earlier one', async () => {
      const first = createPending();
      const second = createPending();
      let status;
      first.promise.then((result) => { status = result.status; });
      arm(channel(1), first);
      arm(channel(1), second);
      await flush();
      expect(status).to.equal('canceled');
    });
  });

  describe('createPending', () => {
    it('settles once', async () => {
      const pending = createPending();
      pending.settle({ status: 'canceled' });
      pending.settle({ status: 'unconfirmed' });
      expect(await pending.promise).to.deep.equal({ status: 'canceled' });
    });
  });
});
