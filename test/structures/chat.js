import { expect } from 'chai';
import chat, { attach, emit } from '../../src/structures/chat/chat';
import { updateUser } from '../../src/structures/chat/user';
import { claim, echoed, forgetAll, refused, submitted } from '../../src/structures/chat/pending';

function hooks(overrides = {}) {
  const calls = { reconnect: 0, sent: [], opened: [] };
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
      open: (channel) => {
        calls.opened.push([channel.room, channel.name]);
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

  beforeEach(() => {
    globalThis.chatNames = ['chat-discussion', 'chat-strategy'];
  });

  afterEach(() => {
    removers.splice(0).forEach((remove) => remove());
    forgetAll();
    emit('connected');
    delete globalThis.chatNames;
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
    updateUser({ id: 9, username: 'Nine', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
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

  describe('channel', () => {
    it('gives the private chat with a user', () => {
      const user = updateUser({ id: 733, username: 'Chara', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
      const channel = chat.channel(user);
      expect(channel.room).to.equal('chat-private-733');
      expect(chat.channel(user)).to.equal(channel);
      expect(chat.channel('chat-private-733')).to.equal(channel);
    });

    it('has no private chat with yourself', async () => {
      const { api, calls } = hooks();
      attach(api);
      globalThis.selfId = 735;
      try {
        const me = updateUser({ id: 735, username: 'Me', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
        expect(chat.channel(me)).to.equal(undefined);
        expect(chat.channel('chat-private-735')).to.equal(undefined);
        expect(chat.channel({ type: 'private', id: 735 })).to.equal(undefined);
        expect(chat.open(me)).to.equal(undefined);
        expect(await chat.send(me, 'hi')).to.deep.equal({ status: 'canceled' });
        expect(calls.opened).to.deep.equal([]);
        expect(calls.sent).to.deep.equal([]);
        updateUser({ id: 736, username: 'Frisk', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
        expect(chat.channel('chat-private-736').room).to.equal('chat-private-736');
      } finally {
        delete globalThis.selfId;
      }
    });

    it('does not take an object that only looks like a user', () => {
      expect(chat.channel({ id: 733, name: 'Chara' })).to.equal(undefined);
    });

    it('lets send go to a user', () => {
      const { api, calls } = hooks();
      attach(api);
      const user = updateUser({ id: 734, username: 'Asriel', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
      chat.send(user, 'hi');
      expect(calls.sent.map(([channel, text]) => [channel.room, text])).to.deep.equal([['chat-private-734', 'hi']]);
    });
  });

  describe('open', () => {
    const named = ['chat-discussion', 'chat-strategy'];

    beforeEach(() => {
      globalThis.chatNames = named;
    });

    afterEach(() => {
      delete globalThis.chatNames;
    });

    it('opens a public room by id, name or channel', () => {
      const { api, calls } = hooks();
      attach(api);
      expect(chat.open(2).room).to.equal('chat-public-2');
      expect(chat.open('strategy').room).to.equal('chat-public-2');
      expect(chat.open({ type: 'public', id: '1', room: 'chat-public-1' }).room).to.equal('chat-public-1');
      expect(calls.opened).to.deep.equal([
        ['chat-public-2', 'chat-strategy'],
        ['chat-public-2', 'chat-strategy'],
        ['chat-public-1', 'chat-discussion'],
      ]);
    });

    it('opens a private chat with a user, using their name', () => {
      const { api, calls } = hooks();
      attach(api);
      const user = updateUser({ id: 412, username: 'Frisk', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
      expect(chat.open(user).room).to.equal('chat-private-412');
      expect(chat.open('chat-private-412').room).to.equal('chat-private-412');
      expect(chat.open('chat-private-90001')).to.equal(undefined);
      expect(calls.opened).to.deep.equal([
        ['chat-private-412', 'Frisk'],
        ['chat-private-412', 'Frisk'],
      ]);
    });

    it('opens room 0, which has no name in the list, and refuses a room that does not exist', () => {
      const { api, calls } = hooks();
      attach(api);
      expect(chat.open(0).room).to.equal('chat-public-0');
      expect(chat.open('chat-public-99')).to.equal(undefined);
      expect(calls.opened).to.deep.equal([['chat-public-0', '']]);
    });

    it('takes exactly the targets that chat.channel takes', () => {
      const { api } = hooks();
      attach(api);
      globalThis.selfId = 740;
      try {
        const user = updateUser({ id: 741, username: 'Toriel', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
        const me = updateUser({ id: 740, username: 'Me', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] });
        const targets = [0, 1, 2, 99, -1, 1.5, '2', '0', 'strategy', 'nowhere', 'chat-public-1', 'chat-public-0', 'chat-private-9', 'chat-private-740', user, me, {}, true, undefined];
        targets.forEach((target) => {
          expect(chat.open(target), String(target)).to.equal(chat.channel(target));
        });
      } finally {
        delete globalThis.selfId;
      }
    });

    it('does nothing for what it cannot resolve', () => {
      const { api, calls } = hooks();
      attach(api);
      expect(chat.open('nowhere')).to.equal(undefined);
      expect(chat.open({})).to.equal(undefined);
      expect(chat.open(-1)).to.equal(undefined);
      expect(calls.opened).to.deep.equal([]);
    });

    it('gives nothing back when the game does not open it', () => {
      attach(hooks({ open: () => false }).api);
      expect(chat.open(1)).to.equal(undefined);
    });
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
