import { expect } from 'chai';
import ChatChannel from '../../src/structures/chat/channel';
import { channelFromData, channelFromRoom } from '../../src/structures/chat/message';

const names = ['chat-discussion', 'chat-strategy', 'chat-beginner', 'chat-tournament', 'chat-roleplay'];

describe('ChatChannel', () => {
  afterEach(() => {
    delete globalThis.chatNames;
    delete globalThis.openPublicChats;
    delete globalThis.privateChats;
  });

  it('names its room', () => {
    expect(new ChatChannel('public', '5').room).to.equal('chat-public-5');
    expect(new ChatChannel('private', '9').room).to.equal('chat-private-9');
  });

  it('cannot be changed', () => {
    expect(Object.isFrozen(new ChatChannel('public', '1'))).to.equal(true);
  });

  describe('name', () => {
    it('is the game key for a public room', () => {
      globalThis.chatNames = names;
      expect(new ChatChannel('public', '1').name).to.equal('chat-discussion');
      expect(new ChatChannel('public', '5').name).to.equal('chat-roleplay');
    });

    it('is undefined for a room the game does not name', () => {
      globalThis.chatNames = names;
      expect(new ChatChannel('public', '99').name).to.equal(undefined);
    });

    it('is undefined when the game has no names yet', () => {
      expect(new ChatChannel('public', '5').name).to.equal(undefined);
    });

    it('is undefined for a private chat', () => {
      globalThis.chatNames = names;
      expect(new ChatChannel('private', '5').name).to.equal(undefined);
    });
  });

  describe('open', () => {
    it('follows the game\'s open public rooms, as they change', () => {
      globalThis.openPublicChats = [1];
      const channel = new ChatChannel('public', '5');
      expect(channel.open).to.equal(false);
      globalThis.openPublicChats.push(5);
      expect(channel.open).to.equal(true);
    });

    it('matches an id the game stored as a number', () => {
      globalThis.openPublicChats = [5];
      expect(new ChatChannel('public', '5').open).to.equal(true);
    });

    it('follows the game\'s private chats', () => {
      globalThis.privateChats = {};
      const channel = new ChatChannel('private', '9');
      expect(channel.open).to.equal(false);
      globalThis.privateChats[9] = [];
      expect(channel.open).to.equal(true);
    });

    it('is false before the game has any chats', () => {
      expect(new ChatChannel('public', '1').open).to.equal(false);
      expect(new ChatChannel('private', '1').open).to.equal(false);
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
});
