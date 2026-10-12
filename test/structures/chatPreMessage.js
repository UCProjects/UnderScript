import { expect } from 'chai';
import 'src/base/plugin/logger';
import 'src/base/plugin/chat';
import chat, { emitCancelable } from '../../src/structures/chat/chat';

const message = { id: 1, text: 'hello' };
let counter = 0;

describe('preMessage', () => {
  const removers = [];
  const listen = (listener) => {
    chat.on('preMessage', listener);
    removers.push(() => chat.off('preMessage', listener));
  };

  afterEach(() => {
    removers.splice(0).forEach((remove) => remove());
  });

  it('is not canceled when nobody cancels it', () => {
    listen(() => {});
    expect(emitCancelable('preMessage', false, message)).to.equal(false);
  });

  it('is not canceled when nobody is listening', () => {
    expect(emitCancelable('preMessage', false, message)).to.equal(false);
  });

  it('is canceled when a listener cancels it', () => {
    listen(function cancel() {
      this.canceled = true;
    });
    expect(emitCancelable('preMessage', false, message)).to.equal(true);
  });

  it('gives listeners the message', () => {
    let seen;
    listen((received) => { seen = received; });
    emitCancelable('preMessage', false, message);
    expect(seen).to.equal(message);
  });

  it('keeps a cancel that happened before it, and lets listeners see it', () => {
    let saw;
    listen(function look() {
      saw = this.canceled;
    });
    expect(emitCancelable('preMessage', true, message)).to.equal(true);
    expect(saw).to.equal(true);
  });

  it('shows listeners that nothing canceled it yet', () => {
    let saw;
    listen(function look() {
      saw = this.canceled;
    });
    emitCancelable('preMessage', false, message);
    expect(saw).to.equal(false);
  });

  it('lets a later listener see what an earlier one decided', () => {
    const saw = [];
    listen(function first() {
      saw.push(this.canceled);
      this.canceled = true;
    });
    listen(function second() {
      saw.push(this.canceled);
    });
    expect(emitCancelable('preMessage', false, message)).to.equal(true);
    expect(saw).to.deep.equal([false, true]);
  });

  it('can be canceled from a plugin', () => {
    counter += 1;
    const plugin = globalThis.underscript.plugin(`PreMessage test ${counter}`).chat;
    const listener = function cancel() {
      this.canceled = true;
    };
    plugin.on('preMessage', listener);
    removers.push(() => plugin.off('preMessage', listener));
    expect(emitCancelable('preMessage', false, message)).to.equal(true);
  });

  it('keeps going when a plugin listener throws', () => {
    counter += 1;
    const originalError = console.error; // eslint-disable-line no-console
    console.error = () => {}; // eslint-disable-line no-console
    try {
      const plugin = globalThis.underscript.plugin(`PreMessage test ${counter}`).chat;
      const broken = () => { throw new Error('boom'); };
      plugin.on('preMessage', broken);
      removers.push(() => plugin.off('preMessage', broken));
      listen(function cancel() {
        this.canceled = true;
      });
      expect(emitCancelable('preMessage', false, message)).to.equal(true);
    } finally {
      console.error = originalError; // eslint-disable-line no-console
    }
  });
});
