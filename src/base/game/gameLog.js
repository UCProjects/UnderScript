import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import style from 'src/utils/style';
import Translation from 'src/structures/constants/translation';
import styles from './gameLog.css';

style.add(styles);

let gameActive = false;
const BattleLogSetting = 'underscript.disable.logger';
const setting = settings.register({
  name: Translation.Setting('disable.gamelog'),
  key: 'underscript.disable.gamelog',
  page: 'Game',
  onChange: (to) => {
    if (gameActive) toggle(to);
  },
});

eventManager.on('GameStart', () => {
  gameActive = true;
  eventManager.on(':load', () => {
    if (setting.value()) toggle(true);
    if (!settings.value(BattleLogSetting)) {
      toggle(true, 'left');
      timer(true);
    }
  });

  settings.on(BattleLogSetting, ({ val: to }) => {
    toggle(!to, 'left');
    timer(!to);
  });
});

function toggle(to, clazz = 'hidden') {
  $('#game-history').toggleClass(clazz, to);
}

function timer(apply) {
  $('div.timer').toggleClass('active', apply);
}
