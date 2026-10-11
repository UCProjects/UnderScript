import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import sleep from 'src/utils/sleep';
import onPage from 'src/utils/onPage';
import * as hover from 'src/utils/hover';
import * as cardHelper from 'src/utils/cardHelper';
import Translation from 'src/structures/constants/translation';
import isCtrl from 'src/utils/isCtrl';
import Rarity from 'src/structures/constants/rarity';
import setBypass from './protection';

const setting = settings.register({
  name: Translation.Setting('craft.hotkey'),
  key: 'underscript.disable.craftMax',
  category: Translation.CATEGORY_LIBRARY_CRAFTING,
  onChange() {
    eventManager.emit('refreshhighlight');
  },
  page: 'Library',
});

onPage('Crafting', function craftMax() {
  eventManager.on('refreshhighlight', calculate);

  function calculate() {
    hover.hide();
    document.querySelectorAll('div.card, table.cardBoard, table.card').forEach(checkCard);
  }

  function checkCard(el) {
    const card = $(el);
    card.off('hover');
    if (setting.value()) return;
    const rarity = cardHelper.rarity(el);
    if (Rarity.DETERMINATION.equals(rarity)) return;
    const max = cardHelper.max(rarity);
    const amount = cardHelper.quantity(el);
    if (Number.isNaN(amount) || amount >= max) return;
    const cost = cardHelper.dustCost(el);
    const total = cardHelper.totalDust();
    eventManager.on('underscript:ready', () => {
      if (cost > total) {
        // TODO: translation
        card.hover(hover.show('CTRL Click: insufficient dust'));
      } else {
        // TODO: translation
        card.hover(hover.show(`CTRL Click: Craft up to max(${max})`));
      }
    });
    if (cost > total) return;
    card.off('click').on('click.script', (e) => {
      const id = parseInt(card.attr('id'), 10);
      const shiny = card.hasClass('shiny');
      if (isCtrl(e)) {
        hover.hide();
        const count = max - cardHelper.quantity(el);
        if (count <= 0) return;
        craftCards(id, shiny, count, cost, total);
      } else {
        global('action')(id, shiny);
      }
    });
  }

  let crafting = false;
  function craftCards(id, shiny, count, cost, total) {
    if (crafting) return;
    crafting = true;
    setBypass(true);
    const craft = global('craft');
    let dust = total;
    let remaining = count;
    do {
      dust -= cost;
      craft(id, shiny);
      remaining -= 1;
    } while (remaining && dust >= cost);
    sleep(1000).then(() => { // Wait a second before allowing crafting again
      calculate(); // Re-calculate after crafting
      crafting = false;
      setBypass(false);
    });
  }
});
