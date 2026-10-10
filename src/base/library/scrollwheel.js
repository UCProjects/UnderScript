import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { globalSet } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('library.scrollwheel'),
  key: 'underscript.disable.scrolling',
  refresh: onPage('Decks') || onPage('Crafting'),
  page: 'Library',
  category: Translation.CATEGORY_HOTKEYS,
});

eventManager.on(':preload:Decks :preload:Crafting', function scrollwheelLoaded() {
  globalSet('onload', function onload() {
    this.super?.();
    if (setting.value()) $('#collection').off('mousewheel DOMMouseScroll');
  });
});
