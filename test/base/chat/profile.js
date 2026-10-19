import { expect } from 'chai';
import axios from 'axios';

describe('chat profile card', () => {
  let eventManager;
  let syncFriends;
  let updateUser;
  let place;
  let progress;
  let getNote;
  let setNote;
  let ProfileButton;
  let register;
  let clickSetting;
  let forgetGames;
  let originalAdapter;
  let games = [];
  let requests = 0;

  const raw = (id, extra = {}) => ({
    id,
    username: `User${id}`,
    avatar: { image: 'Frisk', rarity: 'BASE' },
    division: '',
    mainGroup: { id: 1, name: 'Player', priority: 99 },
    groups: [],
    level: 5,
    ...extra,
  });

  const home = () => `<table id="liste"><tbody>${games.map(([gameId, playerId]) => `<tr><td class="spectate-player" onclick="window.location = 'Spectate?gameId=${gameId}&amp;playerId=${playerId}';"></td></tr>`).join('')}</tbody></table>`;

  const settle = () => new Promise((resolve) => { setTimeout(resolve, 5); });

  const labels = () => [...document.querySelectorAll('#underscript-profile .us-profile-button')]
    .filter((item) => !item.hidden)
    .map((item) => item.querySelector('.us-profile-label').textContent);

  const spectate = () => [...document.querySelectorAll('#underscript-profile .us-profile-button')]
    .find((item) => item.querySelector('.glyphicon-eye-open'));

  const post = (id, userId, gameId = -1, details = {}) => {
    document.querySelector('#chat-public-1').insertAdjacentHTML(
      'beforeend',
      `<div id="message-${id}"><span id="info-${userId}">name</span></div>`,
    );
    eventManager.emit('Chat:getMessage', {
      room: 'chat-public-1',
      chatMessage: JSON.stringify({ id, user: raw(userId) }),
    });
    const info = document.querySelector(`#message-${id} #info-${userId}`);
    $(info).data('infos', { user: { id: userId, gameId, ...details } });
    return info;
  };

  const rightClick = (target, init = {}) => {
    const event = new window.MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 20,
      clientY: 30,
      ...init,
    });
    target.dispatchEvent(event);
    return event;
  };

  before(async () => {
    ['Element', 'HTMLElement', 'Node'].forEach((key) => {
      globalThis[key] ??= window[key];
    });
    globalThis.selfId = 1;
    globalThis.selfUsername = 'Me';
    globalThis.selfMainGroup = { priority: 99 };
    globalThis.isFriend = () => false;
    globalThis.$.i18n = (key) => key;
    globalThis.DOMParser ??= window.DOMParser;
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => {
      requests += 1;
      return Promise.resolve({ data: home(), status: 200, statusText: '', headers: {}, config });
    };
    eventManager = (await import('../../../src/utils/eventManager')).default;
    ({ syncFriends, updateUser } = await import('../../../src/structures/chat/user'));
    ({ default: place } = await import('../../../src/base/chat/profile/position'));
    ({ default: progress } = await import('../../../src/base/chat/profile/progress'));
    ({ getNote, setNote } = await import('../../../src/base/chat/profile/notes'));
    await import('../../../src/base/chat/profile/buttons/note');
    ({ ProfileButton, register, clickSetting } = await import('../../../src/base/chat/profile/index'));
    ({ forgetGames } = await import('../../../src/structures/chat/games'));
    await import('../../../src/base/chat/profile/buttons/profile');
    await import('../../../src/base/chat/profile/buttons/message');
    await import('../../../src/base/chat/profile/buttons/mention');
    await import('../../../src/base/chat/profile/buttons/ignore');
    await import('../../../src/base/chat/profile/buttons/spectate');
    await import('../../../src/base/chat/profile/buttons/mute');
  });

  beforeEach(() => {
    document.body.innerHTML = '<div class="chat-box"><div id="chat-public-1"></div><input class="chat-text"></div>';
  });

  afterEach(() => {
    forgetGames();
    games = [];
    requests = 0;
  });

  after(() => {
    axios.defaults.adapter = originalAdapter;
    delete globalThis.selfId;
    delete globalThis.selfUsername;
    delete globalThis.selfMainGroup;
    delete globalThis.isFriend;
  });

  it('opens on right click and shows who it is', () => {
    updateUser(raw(10));
    const event = rightClick(post(1, 10));
    expect(event.defaultPrevented).to.equal(true);
    const popup = document.querySelector('#underscript-profile');
    expect(popup.hidden).to.equal(false);
    expect(popup.querySelector('.us-profile-name').textContent).to.equal('User10');
    expect(popup.querySelector('.us-profile-level').textContent).to.equal('LV 5');
  });

  it('draws the card from the clicked message when the user was first known from the friends list', () => {
    syncFriends([{ id: 40, username: 'User40', online: true, idGame: -1 }]);
    rightClick(post(25, 40, -1, {
      avatar: { image: 'Frisk' },
      profileSkin: { image: 'Base' },
      mainGroup: { name: 'Moderator', priority: 4, icon: 'mod' },
      level: 77,
    }));
    const popup = document.querySelector('#underscript-profile');
    expect(popup.querySelector('.us-profile-avatar img.avatar').getAttribute('src')).to.equal('images/avatars/Frisk.png');
    expect(popup.querySelector('.us-profile-banner').style.backgroundImage).to.contain('profiles/Base.png');
    popup.querySelector('.us-profile-group').dispatchEvent(new window.MouseEvent('mouseenter'));
    expect(popup.lastElementChild.textContent).to.contain('Moderator');
    expect(popup.querySelector('.us-profile-level').textContent).to.equal('LV 77');
  });

  it('uses the game classes for the avatar, with the rarity and the shiny overlay', () => {
    updateUser(raw(41, { avatar: { image: 'Frisk', rarity: 'MYTHIC' }, shinyAvatar: true }));
    rightClick(post(26, 41, -1, { avatar: { image: 'Frisk', rarity: 'MYTHIC' }, shinyAvatar: true }));
    const group = document.querySelector('#underscript-profile .avatarGroup');
    expect(group.querySelector('img.avatar.MYTHIC')).to.not.equal(null);
    expect(group.querySelector('img.rainbowAvatar').getAttribute('src')).to.equal('images/shinyAvatar.gif');
  });

  it('offers profile, mention and ignore to a stranger, in that order', () => {
    updateUser(raw(11));
    rightClick(post(2, 11));
    expect(labels()).to.deep.equal(['underscript.general.profile', 'underscript.general.mention', 'underscript.general.ignore', 'Note']);
  });

  it('puts an icon in front of each label', () => {
    updateUser(raw(18));
    rightClick(post(9, 18));
    const icons = [...document.querySelectorAll('#underscript-profile .us-profile-button')].filter((item) => !item.hidden).map((item) => {
      const icon = item.querySelector('.us-profile-icon');
      return icon.classList.contains('glyphicon') ? [...icon.classList].find((name) => name !== 'glyphicon' && name !== 'us-profile-icon') : icon.textContent;
    });
    expect(icons).to.deep.equal(['glyphicon-user', '@', 'glyphicon-volume-off', 'glyphicon-pencil']);
  });

  it('adds spectate for a friend in a game, but no message unless you are a moderator', async () => {
    games = [[77, 12]];
    updateUser(raw(12));
    syncFriends([{ id: 12, username: 'User12', online: true, idGame: 77 }]);
    rightClick(post(3, 12));
    await settle();
    expect(labels()).to.deep.equal([
      'Spectate',
      'underscript.general.profile',
      'underscript.general.mention',
      'underscript.general.ignore',
      'Note',
    ]);
    expect(document.querySelector('#underscript-profile a').getAttribute('href'))
      .to.equal('/Spectate?gameId=77&playerId=12');
  });

  it('offers spectate to a stranger from the message that was clicked', async () => {
    games = [[42, 25]];
    updateUser(raw(25));
    rightClick(post(16, 25, 42));
    expect(spectate().hidden).to.equal(false);
    await settle();
    expect(spectate().hidden).to.equal(false);
    expect(spectate().querySelector('a').getAttribute('href')).to.equal('/Spectate?gameId=42&playerId=25');
    expect(spectate().querySelector('.glyphicon-eye-open').classList.contains('green')).to.equal(true);
  });

  it('does not offer spectate from an older message of the same user', async () => {
    updateUser(raw(26, { gameId: 9 }));
    rightClick(post(17, 26, -1));
    expect(spectate().hidden).to.equal(true);
    await settle();
    expect(spectate().hidden).to.equal(true);
  });

  it('offers spectate once the games list shows the user in a game', async () => {
    games = [[7, 27]];
    updateUser(raw(27, { gameId: 5 }));
    rightClick(post(18, 27, -1));
    expect(spectate().hidden).to.equal(true);
    await settle();
    expect(spectate().hidden).to.equal(false);
    expect(spectate().querySelector('a').getAttribute('href')).to.equal('/Spectate?gameId=7&playerId=27');
  });

  it('does not ask for the games list when the message agrees with what is known', async () => {
    updateUser(raw(30, { gameId: 42 }));
    rightClick(post(21, 30, 42));
    await settle();
    expect(requests).to.equal(0);
    expect(spectate().hidden).to.equal(false);
    updateUser(raw(32));
    rightClick(post(22, 32, -1));
    await settle();
    expect(requests).to.equal(0);
    expect(spectate().hidden).to.equal(true);
  });

  it('never asks for the games list for a friend', async () => {
    updateUser(raw(31));
    syncFriends([{ id: 31, username: 'User31', online: true, idGame: 12 }]);
    rightClick(post(24, 31, -1));
    await settle();
    expect(requests).to.equal(0);
    expect(spectate().hidden).to.equal(false);
  });

  it('takes spectate away when the games list says the game is over', async () => {
    updateUser(raw(28));
    rightClick(post(19, 28, 42));
    expect(spectate().hidden).to.equal(false);
    await settle();
    expect(spectate().hidden).to.equal(true);
  });

  it('keeps what the message said when the games list cannot be loaded', async () => {
    const adapter = axios.defaults.adapter;
    axios.defaults.adapter = () => Promise.reject(new Error('offline'));
    try {
      updateUser(raw(29));
      rightClick(post(20, 29, 42));
      await settle();
      expect(spectate().hidden).to.equal(false);
    } finally {
      axios.defaults.adapter = adapter;
    }
  });

  it('leaves the browser menu alone with ctrl held', () => {
    updateUser(raw(13));
    const event = rightClick(post(4, 13), { ctrlKey: true });
    expect(event.defaultPrevented).to.equal(false);
  });

  it('still opens when the page blocks right clicks on the body', () => {
    const block = () => false;
    $('body').on('contextmenu', block);
    try {
      updateUser(raw(17));
      rightClick(post(8, 17));
      expect(document.querySelector('#underscript-profile').hidden).to.equal(false);
    } finally {
      $('body').off('contextmenu', block);
    }
  });

  it('ignores right clicks on anything else', () => {
    document.querySelector('#chat-public-1').insertAdjacentHTML('beforeend', '<span id="plain">x</span>');
    expect(rightClick(document.querySelector('#plain')).defaultPrevented).to.equal(false);
  });

  it('puts the name in the chat box when mentioning', () => {
    updateUser(raw(14));
    rightClick(post(5, 14));
    const input = document.querySelector('.chat-text');
    input.value = 'hello';
    [...document.querySelectorAll('#underscript-profile button')]
      .find((button) => button.textContent.endsWith('underscript.general.mention')).click();
    expect(input.value).to.equal('hello @User14 ');
    expect(document.querySelector('#underscript-profile').hidden).to.equal(true);
  });

  it('closes when another user is picked', () => {
    updateUser(raw(15));
    updateUser(raw(16));
    rightClick(post(6, 15));
    rightClick(post(7, 16));
    expect(document.querySelectorAll('#underscript-profile')).to.have.length(1);
    expect(document.querySelector('#underscript-profile .us-profile-name').textContent).to.equal('User16');
  });

  describe('clicking a name', () => {
    const click = (target, init = {}) => {
      const event = new window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        detail: 1,
        clientX: 20,
        clientY: 30,
        ...init,
      });
      target.dispatchEvent(event);
      return event;
    };
    const card = () => document.querySelector('#underscript-profile');

    afterEach(() => clickSetting.set(false));

    it('leaves the game dialog alone by default', () => {
      updateUser(raw(20));
      const name = post(10, 20);
      let gameOpened = false;
      name.addEventListener('click', () => { gameOpened = true; });
      const event = click(name);
      expect(event.defaultPrevented).to.equal(false);
      expect(gameOpened).to.equal(true);
      expect(card()?.hidden ?? true).to.equal(true);
    });

    it('opens the card instead of the game dialog when switched on', () => {
      clickSetting.set(true);
      updateUser(raw(21));
      const name = post(11, 21);
      let gameOpened = false;
      name.addEventListener('click', () => { gameOpened = true; });
      const event = click(name);
      expect(event.defaultPrevented).to.equal(true);
      expect(gameOpened).to.equal(false);
      expect(card().hidden).to.equal(false);
      expect(card().querySelector('.us-profile-name').textContent).to.equal('User21');
    });

    it('leaves the game dialog to ctrl click', () => {
      clickSetting.set(true);
      updateUser(raw(22));
      const name = post(12, 22);
      let gameOpened = false;
      name.addEventListener('click', () => { gameOpened = true; });
      click(name, { ctrlKey: true });
      expect(gameOpened).to.equal(true);
      expect(card()?.hidden ?? true).to.equal(true);
    });

    it('ignores other mouse buttons', () => {
      clickSetting.set(true);
      updateUser(raw(23));
      const event = click(post(13, 23), { button: 1 });
      expect(event.defaultPrevented).to.equal(false);
    });

    it('opens from the keyboard too, next to the name', () => {
      clickSetting.set(true);
      updateUser(raw(24));
      click(post(14, 24), { detail: 0, clientX: 0, clientY: 0 });
      expect(card().hidden).to.equal(false);
    });

    it('does not touch clicks elsewhere', () => {
      clickSetting.set(true);
      document.querySelector('#chat-public-1').insertAdjacentHTML('beforeend', '<span id="plain">x</span>');
      expect(click(document.querySelector('#plain')).defaultPrevented).to.equal(false);
    });
  });

  it('writes the elo over the division icon, for master and above only', () => {
    updateUser(raw(44, { division: 'HIGH_MASTER', eloRanked: 2503 }));
    rightClick(post(29, 44));
    const elo = document.querySelector('#underscript-profile .us-profile-division .us-profile-elo');
    expect(elo.textContent).to.equal('2503');
    expect(elo.classList.contains('HIGH_MASTER_COLOR')).to.equal(true);

    updateUser(raw(45, { division: 'DIAMOND_I', eloRanked: 1800 }));
    rightClick(post(30, 45));
    expect(document.querySelector('#underscript-profile .us-profile-elo')).to.equal(null);

    updateUser(raw(46, { division: 'MASTER' }));
    rightClick(post(31, 46));
    expect(document.querySelector('#underscript-profile .us-profile-elo')).to.equal(null);
  });

  it('draws a progress bar below the icon before master', () => {
    updateUser(raw(47, { division: 'DIAMOND_I', eloRanked: 1535 }));
    rightClick(post(32, 47));
    const bar = document.querySelector('#underscript-profile .us-profile-division progress');
    expect(bar.classList.contains('DIAMONDBar')).to.equal(true);
    expect([bar.min, bar.value, bar.max]).to.deep.equal([0, 15, 30]);

    updateUser(raw(48, { division: 'MASTER', eloRanked: 1600 }));
    rightClick(post(33, 48));
    expect(document.querySelector('#underscript-profile progress')).to.equal(null);

    updateUser(raw(49, { division: 'GOLD_II' }));
    rightClick(post(34, 49));
    expect(document.querySelector('#underscript-profile progress')).to.equal(null);
  });

  it('asks for the actual division icon, tier included', () => {
    const asked = [];
    const { i18n } = $;
    $.i18n = (key) => {
      asked.push(key);
      return key;
    };
    try {
      updateUser(raw(42, { division: 'DIAMOND_I' }));
      rightClick(post(27, 42));
      updateUser(raw(43, { division: 'HIGH_MASTER' }));
      rightClick(post(28, 43));
    } finally {
      $.i18n = i18n;
    }
    expect(asked.filter((key) => key.includes('DIVISION'))).to.deep.equal([
      '{{DIVISION:DIAMOND_I}}',
      '{{DIVISION:HIGH_MASTER}}',
    ]);
  });

  it('shows division and group names as notes inside the card, not as native titles', () => {
    const { i18n } = $;
    $.i18n = (key) => (key.includes('DIVISION') ? '<img src="x.png" title="HIGH MASTER">' : key);
    try {
      updateUser(raw(19, { division: 'HIGH_MASTER', mainGroup: { id: 1, name: 'Player', priority: 99, icon: 'badge' } }));
      rightClick(post(15, 19));
    } finally {
      $.i18n = i18n;
    }
    const popup = document.querySelector('#underscript-profile');
    expect(popup.querySelector('[title]')).to.equal(null);
    popup.querySelector('.us-profile-division img').dispatchEvent(new window.MouseEvent('mouseenter'));
    expect(popup.lastElementChild.textContent).to.contain('HIGH MASTER');
    popup.querySelector('.us-profile-division img').dispatchEvent(new window.MouseEvent('mouseleave'));
    expect(popup.textContent).to.not.contain('UnderScript');
  });

  describe('notes', () => {
    const noteItem = () => [...document.querySelectorAll('#underscript-profile .us-profile-button')]
      .find((item) => item.querySelector('.glyphicon-pencil'));
    const open = (id, messageId) => {
      updateUser(raw(id));
      rightClick(post(messageId, id));
      return noteItem();
    };
    const type = (field, text) => {
      field.value = text;
    };
    const key = (field, init) => field.dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));

    it('offers a note button for other users', () => {
      expect(open(60, 40).querySelector('.us-profile-label').textContent).to.equal('Note');
    });

    it('shows what was written as a hover note, and nothing when empty', () => {
      const empty = open(61, 41);
      empty.dispatchEvent(new window.MouseEvent('mouseenter'));
      expect(document.querySelector('#underscript-profile .us-profile-note-preview')).to.equal(null);

      setNote(62, 'met in the lobby');
      const item = open(62, 42);
      expect(item.querySelector('.yellow')).to.not.equal(null);
      item.dispatchEvent(new window.MouseEvent('mouseenter'));
      expect(document.querySelector('#underscript-profile .us-profile-note-preview').textContent).to.equal('met in the lobby');
      item.dispatchEvent(new window.MouseEvent('mouseleave'));
      expect(document.querySelector('#underscript-profile .us-profile-note-preview')).to.equal(null);
    });

    it('expands to an editor on click without closing the card', () => {
      setNote(63, 'old');
      const item = open(63, 43);
      item.querySelector('button').click();
      const field = item.querySelector('textarea');
      expect(field.value).to.equal('old');
      expect(item.querySelector('button').hidden).to.equal(true);
      expect(document.querySelector('#underscript-profile').hidden).to.equal(false);
    });

    it('saves with ctrl+enter and when leaving the field', () => {
      const item = open(64, 44);
      item.querySelector('button').click();
      let field = item.querySelector('textarea');
      type(field, '  first  ');
      key(field, { key: 'Enter', ctrlKey: true });
      expect(getNote(64)).to.equal('first');
      expect(item.querySelector('textarea')).to.equal(null);
      expect(item.querySelector('button').hidden).to.equal(false);
      expect(item.querySelector('.yellow')).to.not.equal(null);

      item.querySelector('button').click();
      field = item.querySelector('textarea');
      type(field, 'second');
      field.dispatchEvent(new window.FocusEvent('blur'));
      expect(getNote(64)).to.equal('second');
    });

    it('drops the edit on escape and keeps the card open', () => {
      setNote(65, 'keep');
      const item = open(65, 45);
      item.querySelector('button').click();
      const field = item.querySelector('textarea');
      type(field, 'changed');
      key(field, { key: 'Escape' });
      expect(getNote(65)).to.equal('keep');
      expect(item.querySelector('textarea')).to.equal(null);
      expect(document.querySelector('#underscript-profile').hidden).to.equal(false);
    });

    it('removes the note when saved empty', () => {
      setNote(66, 'gone soon');
      const item = open(66, 46);
      item.querySelector('button').click();
      const field = item.querySelector('textarea');
      type(field, '   ');
      key(field, { key: 'Enter', metaKey: true });
      expect(getNote(66)).to.equal('');
      expect(item.querySelector('.yellow')).to.equal(null);
    });
  });

  it('only registers profile buttons', () => {
    expect(() => register({})).to.throw('ProfileButton');
    expect(() => register(new ProfileButton('extra'))).to.not.throw();
  });

  describe('division progress', () => {
    it('starts at 1100 and is 30 wide for each tier', () => {
      expect(progress('COPPER_III', 1100)).to.deep.equal({ from: 1100, to: 1130, max: 30, value: 0 });
      expect(progress('GOLD_II', 1325)).to.deep.equal({ from: 1310, to: 1340, max: 30, value: 15 });
    });

    it('ends where master begins', () => {
      expect(progress('DIAMOND_I', 1549)).to.deep.equal({ from: 1520, to: 1550, max: 30, value: 29 });
    });

    it('keeps the value inside the tier', () => {
      expect(progress('IRON_I', 0).value).to.equal(0);
      expect(progress('IRON_I', 5000).value).to.equal(30);
    });

    it('has none from master up, for an unknown division, or without elo', () => {
      expect(progress('MASTER', 1700)).to.equal(undefined);
      expect(progress('LEGEND', 3000)).to.equal(undefined);
      expect(progress('NOPE', 1200)).to.equal(undefined);
      expect(progress('GOLD_II', undefined)).to.equal(undefined);
    });
  });

  describe('placement', () => {
    const viewport = { width: 800, height: 600 };
    const size = { width: 200, height: 100 };

    it('opens at the pointer', () => {
      expect(place({ x: 50, y: 60 }, size, viewport)).to.deep.equal({ left: 50, top: 60 });
    });

    it('moves back inside the right and bottom edges', () => {
      expect(place({ x: 790, y: 590 }, size, viewport)).to.deep.equal({ left: 592, top: 492 });
    });

    it('keeps a gap from the top and left edges', () => {
      expect(place({ x: -5, y: 0 }, size, viewport)).to.deep.equal({ left: 8, top: 8 });
    });
  });
});
