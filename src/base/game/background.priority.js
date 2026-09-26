import { infoToast } from 'src/utils/2.toasts.js';
import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import style from 'src/utils/style.js';
import Translation from 'src/structures/constants/translation.js';

const NONE = 'None';

const levels = [{
  text: 'Legend',
  rank: 'LEGEND',
}, {
  text: 'Ultimate Master',
  rank: 'ULTIMATE_MASTER',
}, {
  text: 'High Master',
  rank: 'HIGH_MASTER',
}, {
  text: 'Master',
  rank: 'MASTER',
}, {
  text: 'Diamond',
  rank: 'DIAMOND',
}, {
  text: 'Emerald',
  rank: 'EMERALD',
}, {
  text: 'Gold',
  rank: 'GOLD',
}, {
  text: 'Iron',
  rank: 'IRON',
}, {
  text: 'Copper',
  rank: 'COPPER',
}, {
  text: NONE,
}];

// Match against index rather than encoded value
levels.forEach((level, index) => {
  level.index = index;
  level.val = level.rank || NONE.toUpperCase();
  const classes = ['PRIORITY'];
  if (level.rank) {
    classes.push(level.rank);
    const key = `division-${level.rank.replaceAll('_', '-')}`;
    const fallback = level.text;
    level.text = () => Translation.Vanilla(key, fallback).translate();
  }
  level.class = classes.join(' ');
});

const boardClasses = levels
  .filter(({ rank }) => rank)
  .map(({ rank }) => `BOARD_${rank}`)
  .join(' ');

style.add(
  '.sortedList .PRIORITY.COPPER { --color: #b87333; }',
  '.sortedList .PRIORITY.IRON { --color: #8f8f8f; }',
  '.sortedList .PRIORITY.GOLD { --color: #ffe455; }',
  '.sortedList .PRIORITY.EMERALD { --color: #00ca78; }',
  '.sortedList .PRIORITY.DIAMOND { --color: #00ced2; }',
  '.sortedList .PRIORITY.MASTER { --color: #ffb100; }',
  '.sortedList .PRIORITY.HIGH_MASTER { --color: #ff7b00; }',
  '.sortedList .PRIORITY.ULTIMATE_MASTER { --color: #ff3c00; }',
  '.sortedList .PRIORITY.LEGEND { animation-name: rainbowSetting; animation-duration: 7s; animation-timing-function: linear; animation-iteration-count: infinite; }',
  '@keyframes rainbowSetting { 0% { box-shadow: inset 0px 0px 20px 1px #f00; } 17% { box-shadow: inset 0px 0px 20px 1px #ff0; } 33% { box-shadow: inset 0px 0px 20px 1px #0f0; } 50% { box-shadow: inset 0px 0px 20px 1px #0ff; } 67% { box-shadow: inset 0px 0px 20px 1px #00f; } 84% { box-shadow: inset 0px 0px 20px 1px #f0f; } 100% { box-shadow: inset 0px 0px 20px 1px #f00; } }',
  '.sortedList .PRIORITY { padding-left: 5px; margin-bottom: 5px; box-shadow: inset 0px 0px 20px 1px var(--color); }',
);

const notify = settings.register({
  name: Translation.Setting('board.priority.notify'),
  key: 'underscript.board.priority.notify',
  default: true,
  page: 'Game',
  category: Translation.CATEGORY_BOARD_BACKGROUND,
});

const setting = settings.register({
  name: Translation.Setting('board.priority'),
  key: 'underscript.board.priority',
  type: 'list',
  page: 'Game',
  category: Translation.CATEGORY_BOARD_BACKGROUND,
  data: levels,
});

eventManager.on('connect', (data) => {
  // if (global('spectate')) return;

  const { oldDivision = '' } = JSON.parse(data.you);
  const oldRank = getRank(oldDivision);
  const level = getLevel(oldRank);
  if (!level) return;

  // Remove old rank
  $('#yourSide').removeClass(boardClasses);

  // Get preferred board value
  const value = setting.value().find(({ index }) => index >= level.index);
  if (!value || !value.rank) {
    if (notify.value()) {
      infoToast('Your board background has been disabled');
    }
    return;
  }

  // Set new division
  $('#yourSide').addClass(`BOARD_${value.rank}`);
  if (notify.value() && oldRank !== value.rank) {
    infoToast(`Your board background has been set to "${value.text()}"`);
  }
});

function getLevel(rank = '') {
  return levels.find(({ rank: text }) => text === rank);
}

function getRank(division = '') {
  return division.replace(/_I{1,3}$/, '');
}
