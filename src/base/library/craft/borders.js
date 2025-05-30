import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import sleep from 'src/utils/sleep.js';
import { infoToast } from 'src/utils/2.toasts.js';
import onPage from 'src/utils/onPage.js';
import style from 'src/utils/style.js';
import * as cardHelper from 'src/utils/cardHelper.js';

const setting = settings.register({
  name: 'Disable Crafting Highlight',
  key: 'underscript.disable.craftingborder',
  onChange: () => {
    if (onPage('Crafting')) {
      sleep().then(() => eventManager.emit('refreshhighlight'));
    }
  },
  category: 'Crafting',
  page: 'Library',
});

onPage('Crafting', function craftableCards() {
  style.add(
    '.craftable .cardFrame { -webkit-filter: grayscale(100%) brightness(45%) sepia(100%) hue-rotate(80deg) saturate(400%) contrast(1.5); filter: grayscale(100%) brightness(45%) sepia(100%) hue-rotate(80deg) saturate(400%) contrast(1.5); }',
    '.highlight-green { text-shadow: 0px 0px 10px #008000; color: #00cc00; }',
  );

  function highlight(el) {
    const rarity = cardHelper.rarity(el);
    const set = !setting.value() &&
        rarity !== 'DETERMINATION' &&
        cardHelper.quantity(el) < cardHelper.max(rarity) &&
        cardHelper.dustCost(el) <= cardHelper.totalDust();
    el.classList.toggle('craftable', set);
  }

  function update({ id, shiny, dust }) {
    if (dust >= cardHelper.dustCost('LEGENDARY', true)) {
      const el = cardHelper.find(id, shiny);
      if (el) highlight(el);
    } else {
      highlightCards();
    }
  }

  function highlightCards() {
    document.querySelectorAll('div.card, table.cardBoard, table.card').forEach(highlight);
  }

  eventManager.on('craftcard', update);
  eventManager.on('refreshhighlight', highlightCards);
  eventManager.on('Craft:RefreshPage', () => eventManager.emit('refreshhighlight'));

  infoToast('Craftable cards are highlighted in <span class="highlight-green">green</span>', 'underscript.notice.craftingborder', '1');
});
