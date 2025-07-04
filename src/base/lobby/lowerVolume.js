import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import Translation from 'src/structures/constants/translation.ts';

const volume = settings.register({
  name: Translation.Setting('volume.match.found'),
  key: 'underscript.volume.gameFound',
  type: 'slider',
  default: 0.3,
  max: 1,
  step: 0.1,
  page: 'Lobby',
  reset: true,
});

eventManager.on('getWaitingQueue', function lowerVolume() {
  // Lower the volume, the music changing is enough as is
  global('audioQueue').volume = parseFloat(volume.value());
});
