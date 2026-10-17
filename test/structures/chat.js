import { expect } from 'chai';
import chat, { attach, emit } from '../../src/structures/chat/chat';
import { claim, echoed, forgetAll, refused, submitted } from '../../src/structures/chat/pending';

function hooks(overrides = {}) {
  const calls = { reconnect: 0, sent: [] };
  return {
    calls,
    api: {
      connected: () => true,
      reconnect: () => { calls.reconnect += 1; },
      send: (channel, text) => {
        calls.sent.push([channel, text]);
        submitted(channel, claim(channel), text);
        return true;
      },
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
    forgetAll();
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
    chat.send(channel, 'hi');
    chat.send('chat-private-9', 'psst');
    expect(calls.sent).to.deep.equal([
      [channel, 'hi'],
      [{ type: 'private', id: '9', room: 'chat-private-9' }, 'psst'],
    ]);
  });

  it('refuses what it cannot send, and says so in the result', async () => {
    const { api, calls } = hooks();
    attach(api);
    expect(await chat.send('nowhere', 'hi')).to.deep.equal({ status: 'canceled' });
    expect(await chat.send('chat-public-1', '')).to.deep.equal({ status: 'canceled' });
    expect(await chat.send('chat-public-1', 5)).to.deep.equal({ status: 'canceled' });
    expect(calls.sent).to.deep.equal([]);
  });

  describe('send result', () => {
    const channel = { type: 'public', id: '1', room: 'chat-public-1' };

    it('is a promise', () => {
      attach(hooks().api);
      expect(chat.send(channel, 'hi')).to.be.instanceOf(Promise);
    });

    it('settles as sent when the message comes back', async () => {
      attach(hooks().api);
      const result = chat.send(channel, 'hi');
      const echo = { id: 1, channel, author: { id: 7 }, text: 'hi' };
      echoed(echo, 7);
      expect(await result).to.deep.equal({ status: 'sent', message: echo });
    });

    it('settles as rejected when the server refuses it', async () => {
      attach(hooks().api);
      const result = chat.send(channel, 'hi');
      const notice = { kind: 'error', key: 'chat-spam-protection', args: [3], text: 'Slow down' };
      refused(notice);
      expect(await result).to.deep.equal({ status: 'rejected', notice });
    });

    it('settles as canceled when the game does not send it', async () => {
      attach(hooks({ send: () => false }).api);
      expect(await chat.send(channel, 'hi')).to.deep.equal({ status: 'canceled' });
    });

    it('belongs to its own message when two are sent in a row', async () => {
      attach(hooks().api);
      const first = chat.send(channel, 'one');
      const second = chat.send(channel, 'two');
      echoed({ id: 1, channel, author: { id: 7 }, text: 'one' }, 7);
      expect((await first).status).to.equal('sent');
      let secondStatus;
      second.then((result) => { secondStatus = result.status; });
      await new Promise((resolve) => { setImmediate(resolve); });
      expect(secondStatus).to.equal(undefined);
    });
  });

  describe('channel', () => {
    const named = ['chat-discussion', 'chat-strategy', 'chat-beginner', 'chat-tournament', 'chat-roleplay'];

    afterEach(() => {
      delete globalThis.chatNames;
    });

    it('finds a channel by room, key, short key and id', () => {
      globalThis.chatNames = named;
      const channel = chat.channel('chat-public-5');
      expect(channel.room).to.equal('chat-public-5');
      expect(chat.channel('chat-roleplay')).to.equal(channel);
      expect(chat.channel('roleplay')).to.equal(channel);
      expect(chat.channel(5)).to.equal(channel);
      expect(chat.channel('5')).to.equal(channel);
    });

    it('is the same channel every time', () => {
      const channel = chat.channel('chat-private-9');
      expect(chat.channel('chat-private-9')).to.equal(channel);
    });

    it('is nothing for a room that cannot exist', () => {
      expect(chat.channel('nowhere')).to.equal(undefined);
      expect(chat.channel('')).to.equal(undefined);
      expect(chat.channel(-1)).to.equal(undefined);
      expect(chat.channel()).to.equal(undefined);
    });

    it('sends text to its own room and gives the result', async () => {
      const { api, calls } = hooks();
      attach(api);
      const channel = chat.channel('chat-public-1');
      const result = channel.send('hi');
      expect(calls.sent).to.have.length(1);
      expect(calls.sent[0][0]).to.equal(channel);
      expect(calls.sent[0][1]).to.equal('hi');
      const echo = { id: 1, channel, author: { id: 7 }, text: 'hi' };
      echoed(echo, 7);
      expect(await result).to.deep.equal({ status: 'sent', message: echo });
    });

    it('can be stored and used later', async () => {
      const { api, calls } = hooks();
      attach(api);
      const stored = chat.channel('chat-private-9');
      stored.send('one');
      stored.send('two');
      expect(calls.sent.map(([channel, text]) => [channel.room, text])).to.deep.equal([
        ['chat-private-9', 'one'],
        ['chat-private-9', 'two'],
      ]);
    });

    it('can be sent to by name, short name and id', () => {
      globalThis.chatNames = named;
      const { api, calls } = hooks();
      attach(api);
      chat.send('chat-roleplay', 'a');
      chat.send('roleplay', 'b');
      chat.send(5, 'c');
      chat.send('5', 'd');
      expect(calls.sent.map(([channel]) => channel.room)).to.deep.equal(Array(4).fill('chat-public-5'));
    });

    it('is not sent to when the name is not a room', async () => {
      const { api, calls } = hooks();
      attach(api);
      expect(await chat.send('roleplay', 'a')).to.deep.equal({ status: 'canceled' });
      expect(calls.sent).to.deep.equal([]);
    });
  });
});
