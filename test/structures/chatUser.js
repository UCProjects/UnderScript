import { expect } from 'chai';
import chat from '../../src/structures/chat/chat';
import { findUser, findUserByName, setSelfOnline, syncFriends, syncSelf, updateUser } from '../../src/structures/chat/user';
import { parseChatMessage } from '../../src/structures/chat/message';

const data = (extra = {}) => ({
  id: 'u1',
  username: 'Frisk',
  avatar: { image: 'Frisk', rarity: 'BASE' },
  division: 'GOLD_II',
  mainGroup: { id: 2, name: 'Moderator', priority: 4 },
  groups: [],
  ...extra,
});
const channel = { type: 'public', id: '1', room: 'chat-public-1' };
const message = (user, receivedAt) => parseChatMessage({ id: 1, user, message: 'hi' }, channel, receivedAt);

describe('chat users', () => {
  it('gives the same user for the same id', () => {
    expect(updateUser(data({ id: 'same' }))).to.equal(updateUser(data({ id: 'same' })));
    expect(updateUser(data({ id: 8 }))).to.equal(updateUser(data({ id: '8' })));
  });

  it('keeps users apart by id', () => {
    expect(updateUser(data({ id: 'a' }))).to.not.equal(updateUser(data({ id: 'b' })));
  });

  it('updates the user from newer data', () => {
    const user = updateUser(data({ id: 'live' }));
    expect(user).to.include({ name: 'Frisk', division: 'GOLD_II', isMod: true });
    updateUser(data({ id: 'live', username: 'Chara', division: 'DIAMOND_I', mainGroup: undefined }));
    expect(user).to.include({ name: 'Chara', division: 'DIAMOND_I', isMod: false });
    expect(user.mainGroup).to.equal(undefined);
  });

  it('can be looked up once seen', () => {
    expect(findUser('unseen')).to.equal(undefined);
    const user = updateUser(data({ id: 'seen' }));
    expect(findUser('seen')).to.equal(user);
  });

  it('refuses data without an id or a name', () => {
    expect(updateUser(null)).to.equal(undefined);
    expect(updateUser({ id: 1 })).to.equal(undefined);
    expect(updateUser({ username: 'x' })).to.equal(undefined);
  });

  it('is the author of every message from that user', () => {
    const first = message(data({ id: 'author' }), 1);
    const second = message(data({ id: 'author', username: 'Asriel' }), 2);
    expect(first.author).to.equal(second.author);
    expect(first.author.name).to.equal('Asriel');
  });

  it('leaves the message with the data it arrived with', () => {
    const user = data({ id: 'raw' });
    const first = message(user, 1);
    message(data({ id: 'raw', username: 'Asriel' }), 2);
    expect(first.raw.user).to.equal(user);
    expect(first.author.raw.username).to.equal('Asriel');
  });

  it('does not let history overwrite what a live message said', () => {
    const user = message(data({ id: 'history', username: 'New' }), 1).author;
    message(data({ id: 'history', username: 'Old' }));
    expect(user.name).to.equal('New');
  });

  it('is created from history when nothing newer is known', () => {
    expect(message(data({ id: 'fromHistory' })).author.name).to.equal('Frisk');
  });

  it('is its name as a string', () => {
    const user = updateUser(data({ id: 'text', username: 'Papyrus' }));
    expect(`${user}`).to.equal('Papyrus');
  });

  it('finds a user by name, ignoring case', () => {
    const user = updateUser(data({ id: 'named', username: 'Napstablook' }));
    expect(findUserByName('napSTAblook')).to.equal(user);
    expect(findUserByName('nobody-called-this')).to.equal(undefined);
  });

  describe('presence', () => {
    const entry = (extra = {}) => ({ id: 'f1', username: 'Toriel', online: true, idGame: 12, ...extra });

    it('starts out as not a friend, with nothing known', () => {
      const user = updateUser(data({ id: 'stranger' }));
      expect(user).to.include({ isFriend: false, isOnline: undefined, gameId: undefined });
    });

    it('creates a friend that has not spoken', () => {
      syncFriends([entry()]);
      const user = findUser('f1');
      expect(user).to.include({ name: 'Toriel', isFriend: true, isOnline: true, gameId: 12 });
      expect(user.division).to.equal('');
    });

    it('reads a list sent as a JSON string', () => {
      syncFriends(JSON.stringify([entry({ id: 'f2', online: false })]));
      expect(findUser('f2')).to.include({ isFriend: true, isOnline: false });
    });

    it('keeps what a message said about a friend who then appears in the list', () => {
      const user = updateUser(data({ id: 'f3', division: 'GOLD_II' }));
      syncFriends([entry({ id: 'f3' })]);
      expect(user).to.include({ division: 'GOLD_II', isFriend: true });
    });

    it('does not let the list overwrite a name or profile', () => {
      const user = updateUser(data({ id: 'f4', username: 'Sans' }));
      syncFriends([entry({ id: 'f4', username: 'Old name' })]);
      expect(user.name).to.equal('Sans');
    });

    it('forgets a friend that is missing from the next list', () => {
      syncFriends([entry({ id: 'f5' })]);
      syncFriends([entry({ id: 'f6' })]);
      expect(findUser('f5')).to.include({ isFriend: false, isOnline: undefined });
      expect(findUser('f6').isFriend).to.equal(true);
    });

    it('follows a friend going offline', () => {
      syncFriends([entry({ id: 'f7' })]);
      syncFriends([entry({ id: 'f7', online: false, idGame: -1 })]);
      expect(findUser('f7')).to.include({ isOnline: false, gameId: undefined });
    });

    it('reads the game from a live message, and -1 as none', () => {
      const user = updateUser(data({ id: 'game', gameId: 33 }));
      expect(user.gameId).to.equal(33);
      updateUser(data({ id: 'game', gameId: -1 }));
      expect(user.gameId).to.equal(undefined);
    });

    it('keeps the game when a message does not say', () => {
      const user = updateUser(data({ id: 'quiet', gameId: 5 }));
      updateUser(data({ id: 'quiet' }));
      expect(user.gameId).to.equal(5);
    });

    it('lists the friends, and drops one that is removed', () => {
      syncFriends([entry({ id: 'l1' }), entry({ id: 'l2' })]);
      expect(chat.friends.map(({ id }) => id)).to.have.members(['l1', 'l2']);
      syncFriends([entry({ id: 'l2' })]);
      expect(chat.friends.map(({ id }) => id)).to.deep.equal(['l2']);
    });

    it('ignores a list it cannot read', () => {
      expect(() => syncFriends('not json')).to.not.throw();
      expect(() => syncFriends(undefined)).to.not.throw();
      expect(() => syncFriends([null, { id: {} }, { id: 'nameless' }])).to.not.throw();
      expect(findUser('nameless')).to.equal(undefined);
    });
  });

  describe('self', () => {
    const me = (extra = {}) => ({
      id: 'me1',
      level: 12,
      username: 'Chara',
      division: 'GOLD_II',
      mainGroup: { id: 2, name: 'Moderator', priority: 4 },
      groups: [],
      ...extra,
    });

    it('is known before saying anything', () => {
      syncSelf(JSON.stringify(me()));
      expect(findUser('me1')).to.include({ name: 'Chara', division: 'GOLD_II', isMod: true });
    });

    it('reads the avatar and game the game sends about you', () => {
      syncSelf(me({ id: 'me5', avatar: { rarity: 'COMMON', id: 1, name: 'Froggit', image: 'Froggit' }, shinyAvatar: true, gameId: -1 }));
      const user = findUser('me5');
      expect(user.avatar).to.deep.equal({ image: 'Froggit', rarity: 'COMMON' });
      expect(user.shinyAvatar).to.equal(true);
      expect(user.gameId).to.equal(undefined);
    });

    it('is online while chat is connected', () => {
      syncSelf(me({ id: 'me6' }));
      const user = findUser('me6');
      expect(user.isOnline).to.equal(true);
      expect(user.isFriend).to.equal(false);
      setSelfOnline(false);
      expect(user.isOnline).to.equal(false);
      syncSelf(me({ id: 'me6' }));
      expect(user.isOnline).to.equal(true);
    });

    it('reads an object as well', () => {
      syncSelf(me({ id: 'me2' }));
      expect(findUser('me2').name).to.equal('Chara');
    });

    it('updates the same user', () => {
      syncSelf(me({ id: 'me3' }));
      const user = findUser('me3');
      syncSelf(me({ id: 'me3', username: 'Frisk' }));
      expect(findUser('me3')).to.equal(user);
      expect(user.name).to.equal('Frisk');
    });

    it('is what chat.self returns', () => {
      syncSelf(me({ id: 'me4' }));
      globalThis.selfId = 'me4';
      expect(chat.self).to.equal(findUser('me4'));
      delete globalThis.selfId;
      expect(chat.self).to.equal(undefined);
    });

    it('ignores data it cannot read', () => {
      expect(() => syncSelf('not json')).to.not.throw();
      expect(() => syncSelf(undefined)).to.not.throw();
    });
  });
});
