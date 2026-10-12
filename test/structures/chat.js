import { expect } from 'chai';
import chat, { attach, emit } from '../../src/structures/chat/chat';

function hooks(overrides = {}) {
  const calls = { reconnect: 0, sent: [] };
  return {
    calls,
    api: {
      connected: () => true,
      reconnect: () => { calls.reconnect += 1; },
      send: (channel, text) => { calls.sent.push([channel, text]); return true; },
      ...overrides,
    },
  };
}

describe('chat', () => {
  const removers = [];
  const listen = (event, listener) => {
    chat.on(event, listener);
    removers.push(() => chat.off(event, listener));
  };

  afterEach(() => {
    removers.splice(0).forEach((remove) => remove());
    emit('connected');
  });

  it('delivers events to its own listeners', () => {
    const seen = [];
    listen('message', (message) => seen.push(message.text));
    emit('message', { text: 'hello' });
    emit('message', { text: 'again' });
    expect(seen).to.deep.equal(['hello', 'again']);
  });

  it('keeps events apart', () => {
    const seen = [];
    listen('connected', () => seen.push('connected'));
    emit('reconnected');
    emit('disconnected', { code: 1006, reason: '' });
    expect(seen).to.deep.equal([]);
  });

  it('stops delivering after off', () => {
    let count = 0;
    const listener = () => { count += 1; };
    chat.on('reconnected', listener);
    emit('reconnected');
    chat.off('reconnected', listener);
    emit('reconnected');
    expect(count).to.equal(1);
  });

  it('runs once listeners a single time', () => {
    let count = 0;
    chat.once('reconnected', () => { count += 1; });
    emit('reconnected');
    emit('reconnected');
    expect(count).to.equal(1);
  });

  it('can be chained', () => {
    const listener = () => {};
    expect(chat.on('connected', listener)).to.equal(chat);
    expect(chat.off('connected', listener)).to.equal(chat);
  });

  it('tracks when the session was replaced', () => {
    expect(chat.replaced).to.equal(false);
    emit('replaced');
    expect(chat.replaced).to.equal(true);
    emit('reconnected');
    expect(chat.replaced).to.equal(false);
  });

  it('reports the connection through its hooks', () => {
    attach(hooks({ connected: () => false }).api);
    expect(chat.connected).to.equal(false);
    attach(hooks().api);
    expect(chat.connected).to.equal(true);
  });

  it('asks its hooks to reconnect', () => {
    const { api, calls } = hooks();
    attach(api);
    chat.reconnect();
    expect(calls.reconnect).to.equal(1);
  });

  it('sends to a channel object or a room name', () => {
    const { api, calls } = hooks();
    attach(api);
    const channel = { type: 'public', id: '1', room: 'chat-public-1' };
    expect(chat.send(channel, 'hi')).to.equal(true);
    expect(chat.send('chat-private-9', 'psst')).to.equal(true);
    expect(calls.sent).to.deep.equal([
      [channel, 'hi'],
      [{ type: 'private', id: '9', room: 'chat-private-9' }, 'psst'],
    ]);
  });

  it('refuses what it cannot send', () => {
    const { api, calls } = hooks();
    attach(api);
    expect(chat.send('nowhere', 'hi')).to.equal(false);
    expect(chat.send('chat-public-1', '')).to.equal(false);
    expect(calls.sent).to.deep.equal([]);
  });
});
