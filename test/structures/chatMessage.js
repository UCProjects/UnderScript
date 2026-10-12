import { expect } from 'chai';
import { channelFromData, channelFromRoom, parseChatMessage } from '../../src/structures/chat/message';

const user = (extra = {}) => ({
  id: 7,
  username: 'Frisk',
  avatar: { image: 'Frisk', rarity: 'BASE' },
  shinyAvatar: true,
  division: 'GOLD_II',
  mainGroup: { id: 2, name: 'Moderator', priority: 4, icon: 'mod' },
  groups: [{ id: 2, name: 'Moderator', priority: 4, icon: 'mod' }, { id: 9, name: 'Contributor', priority: 12 }],
  ...extra,
});
const raw = (extra = {}) => ({ id: 101, user: user(), message: 'hello', ...extra });
const channel = { type: 'public', id: '1', room: 'chat-public-1' };

describe('parseChatMessage', () => {
  it('reads a message sent as a JSON string', () => {
    const message = parseChatMessage(JSON.stringify(raw()), channel, 1234);
    expect(message.id).to.equal(101);
    expect(message.text).to.equal('hello');
    expect(message.channel).to.equal(channel);
    expect(message.timestamp).to.equal(1234);
    expect(message.action).to.equal(false);
    expect(message.rainbow).to.equal(false);
    expect(message.deleted).to.equal(false);
  });

  it('reads a message that is already an object', () => {
    expect(parseChatMessage(raw(), channel).text).to.equal('hello');
  });

  it('keeps the original object', () => {
    const original = raw();
    expect(parseChatMessage(original, channel).raw).to.equal(original);
  });

  it('reads the flags', () => {
    const message = parseChatMessage(raw({ me: true, rainbow: true, deleted: true }), channel);
    expect(message.action).to.equal(true);
    expect(message.rainbow).to.equal(true);
    expect(message.deleted).to.equal(true);
  });

  it('prefers the timestamp the message carries', () => {
    expect(parseChatMessage(raw({ timestamp: 55 }), channel, 1234).timestamp).to.equal(55);
    expect(parseChatMessage(raw(), channel).timestamp).to.equal(undefined);
  });

  it('describes the author', () => {
    const { author } = parseChatMessage(raw(), channel);
    expect(author.id).to.equal(7);
    expect(author.name).to.equal('Frisk');
    expect(author.avatar).to.deep.equal({ image: 'Frisk', rarity: 'BASE' });
    expect(author.shinyAvatar).to.equal(true);
    expect(author.division).to.equal('GOLD_II');
    expect(author.mainGroup.name).to.equal('Moderator');
    expect(author.groups.map(({ name }) => name)).to.deep.equal(['Moderator', 'Contributor']);
  });

  it('marks moderators and staff by the main group priority', () => {
    const at = (priority) => parseChatMessage(raw({ user: user({ mainGroup: { id: 1, name: 'G', priority } }) }), channel).author;
    expect(at(4)).to.include({ isMod: true, isStaff: true });
    expect(at(6)).to.include({ isMod: false, isStaff: true });
    expect(at(10)).to.include({ isMod: false, isStaff: false });
  });

  it('treats a user with no group as an ordinary player', () => {
    const { author } = parseChatMessage(raw({ user: user({ mainGroup: undefined, groups: undefined }) }), channel);
    expect(author.mainGroup).to.equal(undefined);
    expect(author.groups).to.deep.equal([]);
    expect(author).to.include({ isMod: false, isStaff: false });
  });

  it('gives nothing for data it cannot read', () => {
    expect(parseChatMessage('not json', channel)).to.equal(undefined);
    expect(parseChatMessage(null, channel)).to.equal(undefined);
    expect(parseChatMessage([], channel)).to.equal(undefined);
    expect(parseChatMessage(raw({ message: 5 }), channel)).to.equal(undefined);
    expect(parseChatMessage(raw({ id: undefined }), channel)).to.equal(undefined);
    expect(parseChatMessage(raw({ user: { id: 1 } }), channel)).to.equal(undefined);
  });
});

describe('channels', () => {
  it('reads a room name', () => {
    expect(channelFromRoom('chat-public-3')).to.deep.equal({ type: 'public', id: '3', room: 'chat-public-3' });
    expect(channelFromRoom('chat-private-42')).to.deep.equal({ type: 'private', id: '42', room: 'chat-private-42' });
    expect(channelFromRoom('something-else')).to.equal(undefined);
    expect(channelFromRoom(undefined)).to.equal(undefined);
  });

  it('prefers the room the hook already worked out', () => {
    expect(channelFromData({ action: 'getMessage', idRoom: 1, room: 'chat-public-1' }).id).to.equal('1');
  });

  it('works out the room for a public and a private message', () => {
    expect(channelFromData({ action: 'getMessage', idRoom: 4 })).to.deep.equal({ type: 'public', id: '4', room: 'chat-public-4' });
    expect(channelFromData({ action: 'getPrivateMessage', idFriend: 9 })).to.deep.equal({ type: 'private', id: '9', room: 'chat-private-9' });
  });

  it('gives nothing for other actions', () => {
    expect(channelFromData({ action: 'getInfoMessage' })).to.equal(undefined);
    expect(channelFromData(null)).to.equal(undefined);
  });
});
