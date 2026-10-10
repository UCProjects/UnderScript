import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import onPage from 'src/utils/onPage';
import { window } from 'src/utils/1.variables';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('gamelist'),
  key: 'underscript.disable.adjustSpectateView',
  refresh: () => onPage(''),
  category: Translation.CATEGORY_HOME,
});

eventManager.on(':load:', () => {
  if (setting.value()) return;
  const spectate = $('#liste');
  const tbody = spectate.find('tbody');
  const footer = $('.mainContent footer');
  function doAdjustment() {
    tbody.css({
      height: 'auto',
      'max-height': `${footer.offset().top - spectate.offset().top}px`,
    });
  }
  $('.mainContent > br').remove();
  doAdjustment();
  $(window).on('resize.script', doAdjustment);
});
