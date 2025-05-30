import * as settings from 'src/utils/settings/index.js';
import { globalSet } from 'src/utils/global.js';
import onPage from 'src/utils/onPage.js';
import compound from 'src/utils/compoundEvent.js';

const setting = settings.register({
  name: 'Disable Screen Shake',
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
