import axios from 'axios';
import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { global } from 'src/utils/global.js';
import { toast as fnToast } from 'src/utils/2.toasts.js';
import { debug } from 'src/utils/debug.js';
import debugToast from 'src/utils/debugToast.js';
import * as cardHelper from 'src/utils/cardHelper.js';
import onPage from 'src/utils/onPage.js';
import * as hover from 'src/utils/hover.js';
import each from 'src/utils/each.js';
import { captureError } from 'src/utils/sentry.js';
import hasOwn from 'src/utils/hasOwn.js';
import Translation from 'src/structures/constants/translation.ts';

const setting = settings.register({
  name: Translation.Setting('disenchant'),
  key: 'underscript.disable.disenchant',
  default: true,
  refresh: onPage('Crafting'),
  note: Translation.Setting('disenchant.note'),
  category: Translation.CATEGORY_LIBRARY_CRAFTING,
  page: 'Library',
});

// TODO: More translations
onPage('Crafting', function disenchantWrapper() {
  if (setting.disabled || setting.value()) return;
  let processing = false;

  eventManager.on('jQuery', () => {
    const button = $('<button class="btn btn-info">Smart Disenchant</button>');
    button.click(onclick);
    // Add Disenchant Siny button
    $('#dust').after(' ', button);
  });

  function onclick() {
    const normals = calcCards({ shiny: false });
    const shinies = calcCards({ shiny: true });
    const pNormal = calcCards({ shiny: false, priority: true });
    const pShiny = calcCards({ shiny: true, priority: true });
    BootstrapDialog.show({
      // TODO: translation
      title: 'Smart Disenchant',
      message: `Note: Smart Disenchant will not disenchant DETERMINATION or Shiny BASE cards.<br>
      Normal/Shiny will disenchant <b>ALL</b> normal/shiny cards until you have 0.<br>
      Prioritize will count normal/shiny together and disenchant extra non normal/shiny cards.`,
      onshow(dialog) {
        const window = dialog.getModalFooter();
        // TODO: translation
        window.find('.us-normal').hover(hover.show('Disenchant all normal cards')).prop('disabled', !normals.length);
        window.find('.us-shiny').hover(hover.show('Disenchant all shiny cards')).prop('disabled', !shinies.length);
        window.find('.us-normal-p').hover(hover.show('Disenchant extra shiny cards<br />Note: Also disenchants normals > max')).prop('disabled', !pNormal.length);
        window.find('.us-shiny-p').hover(hover.show('Disenchant extra normal cards<br />Note: Also disenchants shinies > max')).prop('disabled', !pShiny.length);
      },
      onhide: hover.hide,
      buttons: [{
        // TODO: translation
        label: `All Normal (+${calcDust(normals)})`,
        cssClass: 'btn-danger us-normal',
        action(dialog) {
          disenchant(normals);
          dialog.close();
        },
      }, {
        // TODO: translation
        label: `All Shiny (+${calcDust(shinies)})`,
        cssClass: 'btn-danger us-shiny',
        action(dialog) {
          disenchant(shinies);
          dialog.close();
        },
      }, {
        // TODO: translation
        label: `Prioritize Normal (+${calcDust(pNormal)})`,
        cssClass: 'btn-danger us-normal-p',
        action(dialog) {
          disenchant(pNormal);
          dialog.close();
        },
      }, {
        // TODO: translation
        label: `Prioritize Shiny (+${calcDust(pShiny)})`,
        cssClass: 'btn-danger us-shiny-p',
        action(dialog) {
          disenchant(pShiny);
          dialog.close();
        },
      }],
    });
  }

  function updateOrToast(toast, message) {
    processing = false;
    if (toast.exists()) {
      toast.setText(message);
    } else {
      fnToast(message);
    }
  }

  function disenchant(cards) {
    if (!cards.length || processing) return;
    processing = true;
    // TODO: translation
    const toast = fnToast('Please wait while disenchanting.<br />(this may take a while)');
    axios.all(build(cards.splice(0)))
      .then(process)
      .then((response) => {
        if (!response) throw new Error('All errored out');
        const data = response.data;
        const gained = data.dust - parseInt($('#dust').text(), 10);
        $('#dust').text(data.dust);
        $('#totalDisenchant').text(data.totalDisenchant);
        $('#nbDTFragments').text(data.DTFragments);
        $('#btnCraftDT').prop('disabled', data.DTFragments < 2);

        if (data.DTFragments) {
          $('#DTFragmentsDiv').show();
        }
        global('applyFilters')();
        global('showPage')(global('currentPage'));
        // TODO: translation
        updateOrToast(toast, `Finished disenchanting.\n+${gained} dust`);
      }).catch((e) => {
        captureError(e);
        console.error(e); // eslint-disable-line no-console
        // TODO: translation
        updateOrToast(toast, 'Could not complete disenchanting.');
      });
  }

  function build(cards) {
    const promises = [];
    cards.forEach((data) => {
      const limit = data.quantity;
      for (let x = 0; x < limit; x++) {
        promises.push(axios.post('CraftConfig', {
          action: 'disenchant',
          idCard: parseInt(data.id, 10),
          isShiny: data.shiny,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        }));
      }
    });
    debug(cards);
    debug(promises.length);
    return promises;
  }

  function process(responses) {
    // Decrease count for each response
    let last = null;
    const redo = [];
    responses.forEach((response) => {
      debug(response);
      if (response.data === '') {
        const { idCard, isShiny } = JSON.parse(response.config.data);
        redo.push({
          quantity: 1,
          id: idCard,
          shiny: isShiny,
        });
        return;
      }
      if (response.data.status !== 'success') {
        return;
      }
      // There's no guarantee this is in order
      if (!last || response.data.dust > last.data.dust) {
        debug('set');
        last = response;
      }
      global('updateQuantity')(JSON.parse(response.data.card), -1);
    });
    if (redo.length) {
      debug(`Redoing ${redo.length}`);
      return axios.all(build(redo)).then(process);
    }
    debug('last', last);
    return last;
  }

  function cardFilter(card, shiny, priority, family) {
    // TODO: Family filters
    return card.quantity > 0 && include(card.rarity) && (priority || card.shiny === shiny);
  }

  function calcCards({ shiny, priority, deltarune }) {
    const cards = {};
    const extras = [];
    global('collection').filter((card) => cardFilter(card, shiny, priority, deltarune))
      .forEach(({ id, name, shiny: isShiny, rarity, quantity }) => {
        if (priority) {
          if (!hasOwn(cards, id)) {
            const max = cardHelper.max(rarity);
            if (!max) return;
            cards[id] = {
              max, rarity, name,
            };
          }
          cards[id][isShiny ? 'shiny' : 'normal'] = quantity;
        } else {
          extras.push({
            id, name, rarity, quantity, shiny,
          });
        }
      });
    if (priority) {
      // Calculate extras
      each(cards, (data, id) => {
        const name = data.name;
        const rarity = data.rarity;
        const max = data.max;
        if (data.shiny && data.normal) {
          const prioritized = shiny ? data.shiny : data.normal;
          const other = shiny ? data.normal : data.shiny;
          if (prioritized > max) {
            extras.push({
              id,
              shiny,
              rarity,
              name,
              quantity: prioritized - max,
            });
          }
          const slots = Math.max(max - prioritized, 0);
          if (other > slots) {
            extras.push({
              id,
              rarity,
              name,
              shiny: !shiny,
              quantity: other - slots,
            });
          }
        } else {
          const quantity = data.shiny || data.normal;
          if (quantity > max) {
            extras.push({
              id,
              rarity,
              name,
              quantity: quantity - max,
              shiny: !!data.shiny,
            });
          }
        }
      });
    }
    debug(extras, undefined, shiny, priority);
    return extras;
  }

  function calcDust(cards) {
    let total = 0;
    cards.forEach((card) => {
      total += cardHelper.dustGain(card.rarity, card.shiny) * card.quantity;
    });
    return total;
  }

  function include(rarity) {
    switch (rarity) {
      case 'BASE':
      case 'GENERATED':
      case 'TOKEN':
      case 'DETERMINATION': return false;
      case 'LEGENDARY':
      case 'EPIC':
      case 'RARE':
      case 'COMMON': return true;
      default:
        debugToast(`Unknown Rarity: ${rarity}`);
        return false;
    }
  }
});
