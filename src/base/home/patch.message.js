import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import { dismissable } from 'src/utils/2.toasts';
import onPage from 'src/utils/onPage';
import cleanData from 'src/utils/cleanData';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('game.season'),
  key: 'underscript.season.disable',
  refresh: () => onPage(''),
  category: Translation.CATEGORY_HOME,
});
eventManager.on(':preload:', () => {
  if (setting.value()) return;
  document.querySelectorAll('.infoIndex').forEach((el) => {
    const patch = el.querySelector('[data-i18n-custom="home-patch-message"]');
    if (!patch) return;
    const element = $(el);
    const version = patch.dataset.i18nArgs;
    el.remove();
    const prefix = 'underscript.season.dismissed.';
    const key = `${prefix}${version}`;
    cleanData(prefix, key);
    eventManager.on('underscript:ready', () => {
      const translateElement = global('translateElement');
      element.find('[data-i18n-custom],[data-i18n]').each((i, e) => translateElement($(e)));
      const value = element.text();
      if (localStorage.getItem(key) === value) return;
      dismissable({
        key,
        text: element.html(),
        title: Translation.Toast('game.update'),
        value,
      });
    });
  });
});
