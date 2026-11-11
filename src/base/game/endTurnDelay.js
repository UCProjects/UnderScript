import compound from 'src/utils/compoundEvent';
import * as settings from 'src/utils/settings/index';
import game from 'src/structures/game/game';
import { debug } from 'src/utils/debug';
import sleep from 'src/utils/sleep';
import Translation from 'src/structures/constants/translation';

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

compound([game, ':playing'], ':load', () => {
  game.on('turn', function endTurnDelay(turn, mine) {
    if (!mine) return;
    if (turn > 3 && !setting.value()) {
      debug('Waiting');
      $('#endTurnBtn').prop('disabled', true);
      sleep(3000).then(() => {
        $('#endTurnBtn').prop('disabled', false);
      });
    }
  });
});
