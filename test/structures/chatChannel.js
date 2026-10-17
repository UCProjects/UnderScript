import { expect } from 'chai';
import ChatChannel from '../../src/structures/chat/channel';
import chat, { channelFromRoom, findChannel, getChannel } from '../../src/structures/chat/chat';
import { channelFromData } from '../../src/structures/chat/message';

const names = ['chat-discussion', 'chat-strategy', 'chat-beginner', 'chat-tournament', 'chat-roleplay'];

const owner = { send: () => Promise.resolve({ status: 'canceled' }) };

describe('ChatChannel', () => {
  afterEach(() => {
    delete globalThis.chatNames;
    delete globalThis.openPublicChats;
    delete globalThis.privateChats;
  });

  it('names its room', () => {
    expect(new ChatChannel(owner, 'public', '5').room).to.equal('chat-public-5');
    expect(new ChatChannel(owner, 'private', '9').room).to.equal('chat-private-9');
  });

  it('cannot be changed', () => {
    expect(Object.isFrozen(new ChatChannel(owner, 'public', '1'))).to.equal(true);
  });

  describe('name', () => {
    it('is the game key for a public room', () => {
      globalThis.chatNames = names;
      expect(new ChatChannel(owner, 'public', '1').name).to.equal('chat-discussion');
      expect(new ChatChannel(owner, 'public', '5').name).to.equal('chat-roleplay');
    });

    it('is undefined for a room the game does not name', () => {
      globalThis.chatNames = names;
      expect(new ChatChannel(owner, 'public', '99').name).to.equal(undefined);
    });

    it('is undefined when the game has no names yet', () => {
      expect(new ChatChannel(owner, 'public', '5').name).to.equal(undefined);
    });

    it('is undefined for a private chat', () => {
      globalThis.chatNames = names;
      expect(new ChatChannel(owner, 'private', '5').name).to.equal(undefined);
    });
  });

  describe('open', () => {
    it('follows the game\'s open public rooms, as they change', () => {
      globalThis.openPublicChats = [1];
      const channel = new ChatChannel(owner, 'public', '5');
      expect(channel.open).to.equal(false);
      globalThis.openPublicChats.push(5);
      expect(channel.open).to.equal(true);
    });

    it('matches an id the game stored as a number', () => {
      globalThis.openPublicChats = [5];
      expect(new ChatChannel(owner, 'public', '5').open).to.equal(true);
    });

    it('follows the game\'s private chats', () => {
      globalThis.privateChats = {};
      const channel = new ChatChannel(owner, 'private', '9');
      expect(channel.open).to.equal(false);
      globalThis.privateChats[9] = [];
      expect(channel.open).to.equal(true);
    });

    it('is false before the game has any chats', () => {
      expect(new ChatChannel(owner, 'public', '1').open).to.equal(false);
      expect(new ChatChannel(owner, 'private', '1').open).to.equal(false);
    });
  });

  describe('chat.channels', () => {
    it('lists the open public and private chats', () => {
      globalThis.openPublicChats = [1, 5];
      globalThis.privateChats = { 9: [], 12: [] };
      expect(chat.channels.map(({ room }) => room)).to.deep.equal([
        'chat-public-1',
        'chat-public-5',
        'chat-private-9',
        'chat-private-12',
      ]);
    });

    it('skips private entries that are not a history', () => {
      globalThis.privateChats = { 9: [], 12: null };
      expect(chat.channels.map(({ room }) => room)).to.deep.equal(['chat-private-9']);
    });

    it('is empty before the game has any chats', () => {
      expect(chat.channels).to.deep.equal([]);
    });
  });

  describe('built from messages and rooms', () => {
    it('is a ChatChannel with a name', () => {
      globalThis.chatNames = names;
      const fromRoom = channelFromRoom('chat-public-5');
      const fromData = channelFromData({ action: 'getMessage', idRoom: 5 });
      expect(fromRoom).to.be.instanceOf(ChatChannel);
      expect(fromRoom.name).to.equal('chat-roleplay');
      expect(fromData.room).to.equal('chat-public-5');
    });
  });

  describe('getChannel', () => {
    it('gives the same channel for the same room every time', () => {
      expect(getChannel('public', '5')).to.equal(getChannel('public', '5'));
      expect(getChannel('private', '9')).to.equal(getChannel('private', '9'));
    });

    it('tells a public room from a private chat with the same id', () => {
      expect(getChannel('public', '5')).to.not.equal(getChannel('private', '5'));
    });

    it('is the channel that messages, rooms and open chats give', () => {
      globalThis.openPublicChats = [7];
      expect(channelFromRoom('chat-public-7')).to.equal(getChannel('public', '7'));
      expect(channelFromData({ action: 'getMessage', idRoom: 7 })).to.equal(getChannel('public', '7'));
      expect(channelFromData({ action: 'getPrivateMessage', idFriend: 3 })).to.equal(getChannel('private', '3'));
      expect(chat.channels[0]).to.equal(getChannel('public', '7'));
    });
  });

  describe('send', () => {
    it('sends the text through its owner, as itself', async () => {
      const calls = [];
      const sender = {
        send(channel, text) {
          calls.push([channel, text]);
          return Promise.resolve({ status: 'unconfirmed' });
        },
      };
      const channel = new ChatChannel(sender, 'public', '5');
      expect(await channel.send('hello')).to.deep.equal({ status: 'unconfirmed' });
      expect(calls).to.have.length(1);
      expect(calls[0][0]).to.equal(channel);
      expect(calls[0][1]).to.equal('hello');
    });

    it('keeps its owner out of what it shows, so a copy of the channel is still plain data', () => {
      expect(Object.keys(getChannel('public', '5'))).to.deep.equal(['type', 'id', 'room']);
      expect(JSON.stringify(getChannel('public', '5'))).to.equal('{"type":"public","id":"5","room":"chat-public-5"}');
    });
  });

  describe('findChannel', () => {
    it('finds a room', () => {
      expect(findChannel('chat-public-5')).to.equal(getChannel('public', '5'));
      expect(findChannel('chat-private-9')).to.equal(getChannel('private', '9'));
    });

    it('finds the room of a name the game gave it', () => {
      globalThis.chatNames = names;
      expect(findChannel('chat-roleplay')).to.equal(getChannel('public', '5'));
    });

    it('finds a room by its name without the prefix, in any case', () => {
      globalThis.chatNames = names;
      expect(findChannel('roleplay')).to.equal(getChannel('public', '5'));
      expect(findChannel('Roleplay')).to.equal(getChannel('public', '5'));
      expect(findChannel('CHAT-STRATEGY')).to.equal(getChannel('public', '2'));
    });

    it('finds a public room by its id, as a number or as text', () => {
      expect(findChannel(5)).to.equal(getChannel('public', '5'));
      expect(findChannel('5')).to.equal(getChannel('public', '5'));
      expect(findChannel(' 42 ')).to.equal(getChannel('public', '42'));
      expect(findChannel(0)).to.equal(getChannel('public', '0'));
      expect(findChannel('0')).to.equal(getChannel('public', '0'));
    });

    it('finds a room the game has no name for', () => {
      globalThis.chatNames = names;
      expect(findChannel('chat-public-42').name).to.equal(undefined);
      expect(findChannel(42).room).to.equal('chat-public-42');
    });

    it('finds the channel an object describes, and gives back the shared one', () => {
      const shared = getChannel('private', '9');
      expect(findChannel(shared)).to.equal(shared);
      expect(findChannel({ type: 'private', id: '9', room: 'chat-private-9' })).to.equal(shared);
      expect(findChannel({ type: 'public', id: 5 })).to.equal(getChannel('public', '5'));
    });

    it('does not know a name when the game has not named its rooms yet', () => {
      expect(findChannel('roleplay')).to.equal(undefined);
      expect(findChannel('chat-roleplay')).to.equal(undefined);
      expect(findChannel('chat-public-5')).to.equal(getChannel('public', '5'));
      expect(findChannel(5)).to.equal(getChannel('public', '5'));
    });

    it('finds nothing for a name the game does not have', () => {
      globalThis.chatNames = names;
      expect(findChannel('nowhere')).to.equal(undefined);
      expect(findChannel('chat-nowhere')).to.equal(undefined);
    });

    it('finds nothing for something that is not a room', () => {
      globalThis.chatNames = names;
      [undefined, null, true, '', '   ', -1, 1.5, NaN, {}, { type: 'group', id: '1' }, { type: 'public' },
        { type: 'public', id: '' }, { type: 'public', id: -2 }, [], 'chat-public-', 'chat-group-5'].forEach((value) => {
        expect(findChannel(value), JSON.stringify(value)).to.equal(undefined);
      });
    });
  });
});
