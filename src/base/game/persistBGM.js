import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import { isApril, IMAGES } from 'src/utils/isApril';
import { window } from 'src/utils/1.variables';
import Translation from 'src/structures/constants/translation';
import { aprilFools } from '../vanilla/aprilFools';

const setting = settings.register({
  name: Translation.Setting('persist.bgm'),
  key: 'underscript.persist.bgm',
  default: true,
  refresh: () => window.gameId !== undefined,
  page: 'Game',
});

const ignoreModes = ['BOSS', 'STORY', 'TUTORIAL'];
eventManager.on('GameStart', () => {
  eventManager.on('connect', (data) => {
    const val = sessionStorage.getItem(`underscript.bgm.${data.gameId}`);
    if (setting.value() && val) {
      const path = isApril() && !aprilFools.value() ? IMAGES : 'images';
      $('body').css('background-image', `url('${path}/backgrounds/${val}.png')`);
      // Check special skins
      if (!ignoreModes.includes(data.gameType) && global('profileSkinsEnabled')) {
        global('checkSpecialProfileSkin')(JSON.parse(data.yourProfileSkin));
      }
    }
  });

  eventManager.on('playBackgroundMusic', (data) => {
    if (!setting.value()) return;
    const key = `underscript.bgm.${global('gameId')}`;
    const background = sessionStorage.getItem(key);
    if (background) {
      data.name = background;
    } else {
      sessionStorage.setItem(key, data.name);
    }
  });
});
