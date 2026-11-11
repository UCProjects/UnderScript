import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global, globalSet } from 'src/utils/global';
import pendingIgnore from 'src/utils/pendingIgnore';
import pingRegex from 'src/utils/pingRegex';
import { infoToast } from 'src/utils/2.toasts';
import Translation from 'src/structures/constants/translation';
import style from 'src/utils/style';
import Toggle from 'src/utils/Toggle';
import VarStore from 'src/utils/VarStore';

import { pingExtras } from './toast';

style.add('.us-ping { color: yellow; }');

const setting = settings.register({
  name: Translation.Setting('ping'),
  key: 'underscript.disable.ping',
  page: 'Chat',
});

const mask = '<span class="us-ping">$1</span>';

const disabled = new VarStore(false);
const notified = new Toggle();

eventManager.on('preChat:getHistory Chat:getHistory', function enable(data) {
  if (disabled.value || global('soundsEnabled')) {
    if (disabled.value !== 'history') {
      globalSet('soundsEnabled', this.event === 'Chat:getHistory');
    }
    disabled.value = !disabled.value;
  } else {
    disabled.value = 'history';
  }
});

eventManager.on('ChatDetected', () => {
  globalSet('notif', function newNotify(original) {
    if (!setting.value() && !pendingIgnore.consume()) { // TODO
      const text = this.super(original);

      const regex = pingRegex();
      if (regex.test(text)) {
        if (global('soundsEnabled') && original === text) {
          (new Audio('sounds/highlight.wav')).play();
        }
        notify();
        return regex.replace(text, mask);
      }

      return text;
    }
    return original;
  });
});

function notify() {
  if (disabled.value || notified.value) return;
  notified.on();
  if (!pingExtras.value().includes('@underscript')) return;
  infoToast({
    text: Translation.Toast('ping'),
    buttons: [{
      text: Translation.Toast('ping.settings'),
      onClick() {
        pingExtras.show(true);
      },
    }, {
      text: Translation.Toast('ping.remove'),
      onClick() {
        const words = pingExtras.value();
        pingExtras.set(words.filter((word) => word !== '@underscript'));
      },
    }, {
      text: Translation.DISMISS,
    }],
    className: ['dismissable', 'underscript-toast-wrap'],
  }, 'underscript.alert.ping');
}
