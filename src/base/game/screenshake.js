import * as settings from 'src/utils/settings/index';
import { globalSet } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import compound from 'src/utils/compoundEvent';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('disable.rumble'),
  key: 'underscript.disable.rumble',
  options: ['Never', 'Always', 'Spectate'],
  type: 'select',
  page: 'Game',
});

compound('GameStart', ':preload', function rumble() {
  const spectating = onPage('Spectate');
  globalSet('shakeScreen', function shakeScreen(...args) {
    if (!disabled()) this.super(...args);
  });

  function disabled() {
    switch (setting.value()) {
      case 'Spectate': return spectating;
      case 'Always': return true;
      default: return false;
    }
  }
});
