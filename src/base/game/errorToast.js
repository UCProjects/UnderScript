import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import { errorToast } from 'src/utils/2.toasts.js';
import Translation from 'src/structures/constants/translation.js';

const setting = settings.register({
  name: Translation.Setting('disable.errorToast'),
  key: 'underscript.disable.errorToast',
  page: 'Game',
  category: Translation.CATEGORY_NOTIFICATIONS,
});

eventManager.on('getError:before getGameError:before', function toast(data) {
  if (setting.value() || this.canceled) return;
  this.canceled = true;
  errorToast({
    title: $.i18n('dialog-error'),
    text: global('translateFromServerJson')(data.message),
    onClose() {
      document.location.href = 'Play';
    },
  });
});
