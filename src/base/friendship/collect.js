import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import { toast as basicToast, errorToast } from 'src/utils/2.toasts.js';
import * as hover from 'src/utils/hover.js';
import each from 'src/utils/each.js';
import some from 'src/utils/some.js';
import clear from 'src/utils/clear.js';
import Item from 'src/structures/constants/item.js';
import Translation from 'src/structures/constants/translation.ts';

const setting = settings.register({
  name: Translation.Setting('friendship'),
  key: 'underscript.disable.friendship.collect',
  page: 'Library',
  category: Translation.CATEGORY_FRIENDSHIP,
});

const maxClaim = 200 / 5; // Current level limit, no way to dynamically figure this out if he ever adds more rewards
let button;
let collecting = false;
const rewards = {};
let pending = 0;

function canClaim({ notClaimed, claim }) {
  return notClaimed && claim < maxClaim;
}

function canCollect() {
  return some(global('friendshipItems'), canClaim);
}

function claimReward(data) {
  if (canClaim(data)) {
    global('claim')(data.idCard);
    pending += 1;
  }
}

function collect() {
  if (!canCollect() || collecting) return;
  collecting = true;
  pending = 0;
  clear(rewards);
  each(global('friendshipItems'), claimReward);
}

function getLabel(type = '') {
  switch (type) {
    case Item.GOLD: return '<img src="/images/icons/gold.png" class="height-16">';
    case Item.DUST: return '<img src="/images/icons/dust.png" class="height-16">';
    case Item.UT_PACK: return '<img src="/images/icons/pack.png" class="height-16">';
    case Item.DR_PACK: return '<img src="/images/icons/drPack.png" class="height-16">';
    case Item.UTY_PACK: return '<img src="/images/icons/utyPack.png" class="height-16">';
    case Item.SHINY_PACK: return '<img src="/images/icons/shinyPack.png" class="height-16">';
    default: return type.valueOf().toLowerCase();
  }
}

function updateButton(enabled = canCollect()) {
  button.prop('disabled', !enabled);
}

function setupButton(disabled) {
  if (disabled) {
    button.addClass('hidden');
    updateButton(false);
  } else {
    button.removeClass('hidden');
    updateButton();
  }
}

eventManager.on('Friendship:claim', ({
  data, reward, quantity, error,
}) => {
  if (!pending || !collecting) return;
  pending -= 1;

  if (!error) {
    rewards[reward] = (rewards[reward] || 0) + quantity;

    // Claim again if necessary
    claimReward(data);
  }

  if (pending) return;

  eventManager.emit('Friendship:results', error);
});

eventManager.on('Friendship:results', (error) => {
  const lines = [];
  each(rewards, (count, type) => {
    lines.push(`- ${count} ${getLabel(type)}`);
  });
  const toast = error ? errorToast : basicToast;
  toast({
    title: new Translation('toast.friendship', {
      fallback: 'Claimed Friendship Rewards',
    }),
    text: lines.join('<br>'),
  });
  updateButton();
  collecting = false;
});

eventManager.on('Friendship:loaded', () => {
  setupButton(setting.value());
});

eventManager.on(':preload:Friendship', () => {
  button = $('<button class="btn btn-info">Collect All</button>');
  setting.on(setupButton);
  button.on('click.script', collect)
    .hover(hover.show(Translation.General('collect.note')));
  eventManager.on('underscript:ready', () => {
    button.text(Translation.General('collect'));
  });
  $('p[data-i18n="[html]crafting-all-cards"]').css('display', 'inline-block').after(' ', button);
});
