import * as settings from 'src/utils/settings/index.js';
import onPage from 'src/utils/onPage.js';
import Translation from 'src/structures/constants/translation.ts';
import { global } from 'src/utils/global.js';

const CHAT = Translation.Vanilla('settings-chat');
const GAME = Translation.Vanilla('settings-in-game');
const ANIMATION = Translation.Vanilla('settings-animations');

[
  {
    name: Translation.Vanilla('settings-language'),
    key: 'language',
    options() {
      return ['en', 'fr', 'ru', 'es', 'pt', 'cn', 'it', 'pl', 'de']
        .map((locale) => [
          Translation.Vanilla(`chat-${locale}`),
          locale,
        ]);
    },
    refresh: true,
    remove: false,
  },
  {
    name: Translation.Setting('vanilla.chat.rainbow'),
    key: 'chatRainbowDisabled',
    category: CHAT,
  },
  {
    name: Translation.Setting('vanilla.chat.sound'),
    key: 'chatSoundsDisabled',
    category: CHAT,
  },
  {
    name: Translation.Setting('vanilla.chat.avatar'),
    key: 'chatAvatarsDisabled',
    category: CHAT,
  },
  {
    name: Translation.Setting('vanilla.card.shiny'),
    key: 'gameShinyDisabled',
    category: GAME,
  },
  {
    name: Translation.Setting('vanilla.game.music'),
    key: 'gameMusicDisabled',
    category: GAME,
  },
  {
    name: Translation.Setting('vanilla.game.music.volume'),
    key: 'gameMusicVolume',
    type: 'slider',
    category: GAME,
    onChange(val) {
      const audio = global('UCAudio', { throws: false });
      audio?.setMusicVolume(val / 100, false);
    },
  },
  {
    name: Translation.Setting('vanilla.game.jingle'),
    key: 'gameJinglesDisabled',
    category: GAME,
  },
  {
    name: Translation.Setting('vanilla.game.jingle.volume'),
    key: 'gameJingleVolume',
    type: 'slider',
    category: GAME,
    onChange(val) {
      const audio = global('UCAudio', { throws: false });
      audio?.setJingleVolume(val / 100, false);
    },
  },
  {
    name: Translation.Setting('vanilla.game.sound'),
    key: 'gameSoundsDisabled',
    category: GAME,
  },
  {
    name: Translation.Setting('vanilla.game.sound.volume'),
    key: 'gameSoundsVolume',
    type: 'slider',
    category: GAME,
    onChange(val) {
      const audio = global('UCAudio', { throws: false });
      audio?.setEffectsVolume(val / 100, false);
    },
  },
  {
    name: Translation.Setting('vanilla.game.profile'),
    key: 'profileSkinsDisabled',
    category: GAME,
  },
  {
    name: Translation.Setting('vanilla.game.emote'),
    key: 'gameEmotesDisabled',
    category: GAME,
  },
  {
    name: Translation.Setting('vanilla.card.skin'),
    key: 'breakingDisabled',
    category: GAME,
  },
  // show hand to friends.......
  {
    name: Translation.Setting('vanilla.game.shake'),
    key: 'shakeDisabled',
    category: ANIMATION,
  },
  {
    name: Translation.Setting('vanilla.game.stats'),
    key: 'statsDisabled',
    category: ANIMATION,
  },
  {
    name: Translation.Setting('vanilla.game.vfx'),
    key: 'vfxDisabled',
    category: ANIMATION,
  },
  { key: 'deckBeginnerInfo' },
  { key: 'craftBeginnerInfo' },
  { key: 'first' },
  { key: 'playDeck' },
  // { key: 'cardsVersion' }, // no-export?
  // { key: 'allCards' }, // no-export?
  // { key: 'scrollY' },
  // { key: 'browser' },
  // { key: 'leaderboardPage' },
  // { key: 'chat' },
  // { key: 'open-public-chats' },
  // { key: '' },
  // TODO: Add missing keys
].forEach((setting) => {
  const { name, category } = setting;
  const refresh = category === GAME || category === ANIMATION ?
    () => onPage('Game') || onPage('gameSpectating') :
    undefined;
  settings.register({
    refresh,
    remove: true,
    ...setting,
    page: 'game',
    hidden: name === undefined,
  });
});

settings.setDisplayName('Undercards', 'game');
