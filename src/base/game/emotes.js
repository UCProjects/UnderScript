import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global, globalSet } from 'src/utils/global';
import { debug } from 'src/utils/debug';
import onPage from 'src/utils/onPage';
import compound from 'src/utils/compoundEvent';
import Translation from 'src/structures/constants/translation';
import VarStore from 'src/utils/VarStore';

// let live = false;
const self = new VarStore();
const spectating = onPage('Spectate');
const spectate = settings.register({
  name: Translation.Setting('emote.spectate'),
  key: 'underscript.emote.spectate',
  default: true,
  page: 'Game',
  category: Translation.CATEGORY_GAME_EMOTES,
});
const friends = settings.register({
  name: Translation.Setting('emote.friends'),
  key: 'underscript.emote.friends',
  page: 'Game',
  category: Translation.CATEGORY_GAME_EMOTES,
});
const enemy = settings.register({
  name: Translation.Setting('emote.enemy'),
  key: 'underscript.emote.enemy',
  page: 'Game',
  category: Translation.CATEGORY_GAME_EMOTES,
});

compound('GameStart', ':preload', () => {
  self.value = global('selfId', { throws: false });
  // live = true;
  if (disableSpectating()) {
    globalSet('gameEmotesEnabled', false);
    debug('Hiding emotes (spectator)');
  } else {
    const muteEnemy = enemy.value();
    globalSet('enemyMute', muteEnemy);
    if (muteEnemy) {
      debug('Hiding emotes (enemy)');
      $('#enemyMute').toggle(!spectating);
    }
  }
});

eventManager.on('getEmote:before', function hideEmotes(data) {
  // Do nothing if already disabled
  if (this.canceled || !global('gameEmotesEnabled')) return;
  if (friendsOnly(data.idUser)) {
    debug('Hiding emote (friends)');
    this.canceled = true;
  }
});

function disableSpectating() {
  return spectating && !spectate.value();
}

function friendsOnly(id) {
  return self.value && friends.value() && id !== self.value && !global('isFriend')(id);
}
