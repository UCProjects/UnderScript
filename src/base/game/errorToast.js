import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import { errorToast } from 'src/utils/2.toasts';
import Translation from 'src/structures/constants/translation';

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
