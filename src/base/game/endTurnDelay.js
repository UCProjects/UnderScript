import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import { debug } from 'src/utils/debug.js';
import sleep from 'src/utils/sleep.js';
import Translation from 'src/structures/constants/translation.js';

const setting = settings.register({
  name: Translation.Setting('disable.endTurnDelay'),
  key: 'underscript.disable.endTurnDelay',
  page: 'Game',
});

settings.register({
  name: Translation.Setting('endTurnDelay'),
  key: 'underscript.endTurnDelay',
  type: 'select',
  options: [],
  disabled: true,
  hidden: true,
  page: 'Game',
});

eventManager.on('PlayingGame', function endTurnDelay() {
  eventManager.on('getTurnStart', function checkDelay() {
    if (global('userTurn') !== global('userId')) return;
    if (global('turn') > 3 && !setting.value()) {
      debug('Waiting');
      $('#endTurnBtn').prop('disabled', true);
      sleep(3000).then(() => {
        $('#endTurnBtn').prop('disabled', false);
      });
    }
  });
});
