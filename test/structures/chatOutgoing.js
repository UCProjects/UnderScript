import { expect } from 'chai';
import installClock from '../setup/clock';
import chat from '../../src/structures/chat/chat';
import { emitCommand, emitSend } from '../../src/structures/chat/outgoing';
import { claim, echoed, forgetAll, refused, submitted } from '../../src/structures/chat/pending';

describe('outgoing chat events', () => {
  const removers = [];
  const listen = (event, listener) => {
    chat.on(event, listener);
    removers.push(() => chat.off(event, listener));
  };

  afterEach(() => {
    removers.splice(0).forEach((remove) => remove());
  });

  describe('send', () => {
    it('gives listeners the channel and the typed text', () => {
      let seen;
      listen('send', (outgoing) => { seen = outgoing; });
      emitSend('chat-public-2', { value: 'hello' });
      expect(seen.channel.room).to.equal('chat-public-2');
      expect(seen.channel.type).to.equal('public');
      expect(seen.text).to.equal('hello');
    });

    it('is not canceled when nobody cancels it', () => {
      const input = { value: 'hello' };
      expect(emitSend('chat-public-1', input).canceled).to.equal(false);
      expect(input.value).to.equal('hello');
    });

    it('is canceled when a listener cancels it', () => {
      listen('send', function cancel() {
        this.canceled = true;
      });
      expect(emitSend('chat-public-1', { value: 'hello' }).canceled).to.equal(true);
    });

    it('lets a listener change the text', () => {
      listen('send', (outgoing) => {
        outgoing.text = 'changed';
      });
      const input = { value: 'hello' };
      expect(emitSend('chat-private-5', input).canceled).to.equal(false);
      expect(input.value).to.equal('changed');
    });

    it('ignores a replacement that is not a string', () => {
      listen('send', (outgoing) => {
        outgoing.text = 5;
      });
      const input = { value: 'hello' };
      emitSend('chat-public-1', input);
      expect(input.value).to.equal('hello');
    });

    it('does not fire for an empty input', () => {
      let fired = false;
      listen('send', () => { fired = true; });
      expect(emitSend('chat-public-1', { value: '   ' }).canceled).to.equal(false);
      expect(fired).to.equal(false);
    });

    it('does not fire for a room it does not know', () => {
      let fired = false;
      listen('send', () => { fired = true; });
      expect(emitSend('somewhere', { value: 'hello' }).canceled).to.equal(false);
      expect(fired).to.equal(false);
    });
  });

  describe('command', () => {
    const data = () => ({ command: 'me', text: 'waves', output: undefined });

    it('gives listeners the channel, command and text', () => {
      let seen;
      listen('command', (command) => { seen = command; });
      emitCommand('chat-public-1', data(), false);
      expect(seen.channel.room).to.equal('chat-public-1');
      expect(seen.command).to.equal('me');
      expect(seen.text).to.equal('waves');
    });

    it('keeps the raw cancel and lets listeners see it', () => {
      let saw;
      listen('command', function look() {
        saw = this.canceled;
      });
      expect(emitCommand('chat-public-1', data(), true)).to.equal(true);
      expect(saw).to.equal(true);
    });

    it('is canceled when a listener cancels it', () => {
      listen('command', function cancel() {
        this.canceled = true;
      });
      expect(emitCommand('chat-public-1', data(), false)).to.equal(true);
    });

    it('writes output through to the raw data', () => {
      listen('command', (command) => {
        command.output = 'replaced';
      });
      const raw = data();
      emitCommand('chat-public-1', raw, false);
      expect(raw.output).to.equal('replaced');
    });

    it('shows output a raw listener already set', () => {
      let seen;
      listen('command', (command) => { seen = command.output; });
      emitCommand('chat-public-1', { ...data(), output: 'raw' }, false);
      expect(seen).to.equal('raw');
    });

    it('passes the raw cancel through for a room it does not know', () => {
      expect(emitCommand('somewhere', data(), true)).to.equal(true);
      expect(emitCommand('somewhere', data(), false)).to.equal(false);
    });
  });

  describe('send result', () => {
    const where = { type: 'public', id: '3', room: 'chat-public-3' };
    const echo = { id: 1, channel: where, author: { id: 7 }, text: 'hello' };
    const notice = { kind: 'error', key: 'chat-spam-protection', args: [3], text: 'Slow down' };
    let clock;
    let seen;

    beforeEach(() => {
      clock = installClock();
      listen('send', (outgoing) => { seen = outgoing; });
    });

    afterEach(() => {
      clock.tick(60000);
      forgetAll();
      clock.restore();
    });

    it('is a promise on the message the listeners get', () => {
      emitSend('chat-public-3', { value: 'hello' });
      expect(seen.result).to.be.instanceOf(Promise);
    });

    it('settles as canceled when a listener cancels the send', async () => {
      listen('send', function cancel() {
        this.canceled = true;
      });
      const sendingNow = emitSend('chat-public-3', { value: 'hello' });
      sendingNow.finish(sendingNow.canceled);
      expect(await seen.result).to.deep.equal({ status: 'canceled' });
    });

    it('settles as canceled when something after the listeners cancels it', async () => {
      emitSend('chat-public-3', { value: 'hello' }).finish(true);
      expect(await seen.result).to.deep.equal({ status: 'canceled' });
    });

    it('settles as canceled when the game never sends it', async () => {
      emitSend('chat-public-3', { value: 'hello' }).finish(false);
      clock.tick(0);
      expect(await seen.result).to.deep.equal({ status: 'canceled' });
    });

    it('settles as sent when the message goes out and comes back', async () => {
      emitSend('chat-public-3', { value: 'hello' }).finish(false);
      submitted(where, claim(where));
      echoed(echo, 7);
      expect(await seen.result).to.deep.equal({ status: 'sent', message: echo });
    });

    it('settles as rejected when the server refuses it', async () => {
      emitSend('chat-public-3', { value: 'hello' }).finish(false);
      submitted(where, claim(where));
      refused(notice);
      expect(await seen.result).to.deep.equal({ status: 'rejected', notice });
    });

    it('settles as unconfirmed when nothing comes back', async () => {
      emitSend('chat-public-3', { value: 'hello' }).finish(false);
      submitted(where, claim(where));
      clock.tick(5000);
      expect(await seen.result).to.deep.equal({ status: 'unconfirmed' });
    });

    it('is not made for an input with nothing in it', () => {
      let heard = false;
      listen('send', () => { heard = true; });
      emitSend('chat-public-3', { value: '  ' }).finish(false);
      expect(heard).to.equal(false);
    });
  });
});
