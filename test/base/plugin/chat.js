import { expect } from 'chai';
import 'src/base/plugin/logger';
import 'src/base/plugin/chat';
import { attach, emit } from '../../../src/structures/chat/chat';

let counter = 0;

function setup() {
  counter += 1;
  const name = `Chat test ${counter}`;
  return { name, chat: globalThis.underscript.plugin(name).chat };
}

describe('plugin chat', () => {
  const originalError = console.error; // eslint-disable-line no-console
  let errors;

  beforeEach(() => {
    errors = [];
    console.error = (...args) => errors.push(args); // eslint-disable-line no-console
  });

  afterEach(() => {
    console.error = originalError; // eslint-disable-line no-console
    emit('connected');
  });

  it('delivers events to the plugin', () => {
    const { chat } = setup();
    const seen = [];
    chat.on('message', (message) => seen.push(message.text));
    emit('message', { text: 'hello' });
    expect(seen).to.deep.equal(['hello']);
  });

  it('removes a listener by the function that was passed', () => {
    const { chat } = setup();
    let count = 0;
    const listener = () => { count += 1; };
    chat.on('reconnected', listener);
    emit('reconnected');
    chat.off('reconnected', listener);
    emit('reconnected');
    expect(count).to.equal(1);
  });

  it('runs once listeners a single time', () => {
    const { chat } = setup();
    let count = 0;
    chat.once('reconnected', () => { count += 1; });
    emit('reconnected');
    emit('reconnected');
    expect(count).to.equal(1);
  });

  it('logs a failing listener under the plugin name and keeps going', () => {
    const { name, chat } = setup();
    const other = setup();
    let reached = false;
    chat.on('reconnected', () => { throw new Error('boom'); });
    other.chat.on('reconnected', () => { reached = true; });
    emit('reconnected');
    expect(reached).to.equal(true);
    const logged = errors.find((args) => args.some((arg) => typeof arg === 'string' && arg.includes(name)));
    expect(logged, 'error logged with the plugin name').to.not.equal(undefined);
    expect(logged.some((arg) => arg instanceof Error && arg.message === 'boom')).to.equal(true);
  });

  it('logs a rejected promise the same way', async () => {
    const { name, chat } = setup();
    chat.on('reconnected', () => Promise.reject(new Error('later')));
    emit('reconnected');
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    expect(errors.some((args) => args.some((arg) => typeof arg === 'string' && arg.includes(name)))).to.equal(true);
  });

  it('refuses a listener that is not a function', () => {
    const { chat } = setup();
    expect(() => chat.on('message', 5)).to.throw('Must pass a function');
  });

  it('lists the open channels', () => {
    const { chat } = setup();
    globalThis.openPublicChats = [2];
    try {
      expect(chat.channels.map(({ room }) => room)).to.deep.equal(['chat-public-2']);
      expect(globalThis.underscript.chat.channels.map(({ room }) => room)).to.deep.equal(['chat-public-2']);
    } finally {
      delete globalThis.openPublicChats;
    }
  });

  it('shares its state with the global object, which has no actions', () => {
    const { chat } = setup();
    attach({ connected: () => true, reconnect: () => {}, send: () => true });
    expect(chat.connected).to.equal(true);
    expect(globalThis.underscript.chat.connected).to.equal(true);
    emit('replaced');
    expect(chat.replaced).to.equal(true);
    expect(globalThis.underscript.chat.replaced).to.equal(true);
    expect(globalThis.underscript.chat.on).to.equal(undefined);
    expect(globalThis.underscript.chat.send).to.equal(undefined);
    expect(globalThis.underscript.chat.reconnect).to.equal(undefined);
  });
});
