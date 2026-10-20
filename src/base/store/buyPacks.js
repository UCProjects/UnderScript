import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';
import * as hover from 'src/utils/hover';
import wrap from 'src/utils/2.pokemon';
import * as api from 'src/utils/4.api';
import Translation from 'src/structures/constants/translation';
import packs from 'src/structures/packs/packs';
import isCtrl from 'src/utils/isCtrl';
import { getTranslationArray } from '../underscript/translation';

wrap(() => {
  // buy multiple packs
  function buyPacks({
    type, count, gold,
  }) {
    const rawCost = document.querySelector(`#btn${gold ? '' : 'Ucp'}${type}Add`).nextElementSibling.textContent;
    const cost = Number(rawCost);
    if (gold) { // Gold error checking
      const g = parseInt($('#golds').text(), 10);
      if (g < cost * count) {
        throw new Error('Not enough Gold');
      }
    } else { // UCP error checking
      const ucp = parseInt($('#ucp').text(), 10);
      if (ucp < cost * count) {
        throw new Error('Not enough UCP');
      }
    }
    return packs.buy(count, { type, gold });
  }

  function purchase(data) {
    if (data.count === 1) {
      const { type, gold } = data;
      global('addPack')(`add${type}Pack${gold ? '' : 'Ucp'}`, true);
    } else buyPacks(data);
  }

  function getCount(e, cost, baseCost) {
    const affordable = Math.floor(parseInt($(cost ? '#ucp' : '#golds').text(), 10) / baseCost);
    if (isCtrl(e)) return affordable;
    if (e.altKey) return Math.min(10, affordable);
    return 1;
  }

  eventManager.on(':preload:Packs', () => {
    const types = ['', 'DR', 'UTY'];

    types.forEach((type) => {
      ['', 'Ucp'].forEach((cost) => {
        const el = document.querySelector(`#btn${cost}${type}Add`);
        if (!el) return;
        el.onclick = null;
        el.addEventListener('click', (e) => {
          if (packs.buying || packs.opening) return;
          const price = Number(el.nextElementSibling.textContent);
          const count = getCount(e, cost, price);
          if (!count) return;
          const data = {
            count,
            type,
            gold: !cost,
          };
          if (cost && !e.shiftKey) {
            global('BootstrapDialog').show({
              title: `${Translation.PURCHASE}`,
              message: Translation.General('purchase.pack.cost').translate(count, count * price),
              buttons: [{
                label: `${Translation.CONTINUE}`,
                cssClass: 'btn-success',
                action(diag) {
                  purchase(data);
                  diag.close();
                },
              }, {
                label: `${Translation.CANCEL}`,
                cssClass: 'btn-danger',
                action(diag) {
                  diag.close();
                },
              }],
            });
          } else {
            purchase(data);
          }
        });
        eventManager.on('underscript:ready', () => {
          const { key } = Translation.General('purchase.pack.note');
          const array = [...getTranslationArray(key)];
          if (cost) {
            array.push(Translation.General('bypass.shift'));
          }
          $(el).hover(hover.show(array.join('<br>')));
        });
      });
    });

    api.register('buyPacks', (count, { type = '', gold = true } = {}) => {
      if (!types.includes(type)) throw new Error(`Unsupported Pack: ${type}`);
      if (!Number.isInteger(count) || count < 1) throw new Error(`Count(${count}) must be a number`);
      return buyPacks({
        type,
        count,
        gold: !!gold,
      });
    });
  });
});
