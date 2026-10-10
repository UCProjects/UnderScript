import axios from 'axios';
import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import { toast as fnToast } from 'src/utils/2.toasts';
import { debug } from 'src/utils/debug';
import debugToast from 'src/utils/debugToast';
import * as cardHelper from 'src/utils/cardHelper';
import onPage from 'src/utils/onPage';
import each from 'src/utils/each';
import { captureError } from 'src/utils/sentry';
import hasOwn from 'src/utils/hasOwn';
import Translation from 'src/structures/constants/translation';
import Rarity from 'src/structures/constants/rarity';
import * as hover from 'src/utils/hover';
import checkboxGroup, {
  getChecked,
  revealChecked,
  setAllCollapsed,
  setChecked,
} from 'src/utils/checkboxGroup';
import style from 'src/utils/style';
import styles from './disenchant.css';

const setting = settings.register({
  name: Translation.Setting('disenchant'),
  key: 'underscript.disable.disenchant',
  default: true,
  refresh: onPage('Crafting'),
  note: Translation.Setting('disenchant.note'),
  category: Translation.CATEGORY_LIBRARY_CRAFTING,
  page: 'Library',
});

style.add(styles);

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

  const RARITIES = [Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON];
  const CONFIRM = 'us-disenchant-confirm';

  function titleCase(text) {
    return `${text.charAt(0)}${text.slice(1).toLowerCase()}`;
  }

  function cardName({ name }) {
    return $('<span>').text(name).html();
  }

  function cardNode(entry) {
    const copies = Array.from({ length: entry.quantity }, (_, index) => {
      const copy = index + 1;
      return [`Copy ${copy}`, { entry, copy }];
    });
    if (copies.length < 2) return [cardName(entry), copies[0][1]];
    return checkboxGroup(`${cardName(entry)} x${entry.quantity}`, copies, { collapsed: true });
  }

  function buildColumn(entries, shiny) {
    const groups = RARITIES.map((rarity) => {
      const cards = entries
        .filter((entry) => !!entry.shiny === shiny && Rarity.find(entry.rarity) === rarity)
        .sort((a, b) => a.name.localeCompare(b.name));
      const label = Translation.Vanilla(`rarity-${rarity}`, titleCase(String(rarity))).translate();
      return checkboxGroup(label, cards.map(cardNode), { collapsed: true });
    });
    return checkboxGroup(shiny ? 'Shiny' : 'Normal', groups, { collapsible: false });
  }

  function cardKey({ id, shiny }) {
    return `${id}:${!!shiny}`;
  }

  function onclick() {
    const presets = [{
      label: 'Prioritize Normal',
      hint: 'Select extra shiny cards<br />Note: Also selects normals > max',
      cards: calcCards({ shiny: false, priority: true }),
    }, {
      label: 'Prioritize Shiny',
      hint: 'Select extra normal cards<br />Note: Also selects shinies > max',
      cards: calcCards({ shiny: true, priority: true }),
    }];
    const note = Translation.General(
      'disenchant.note',
      'Smart Disenchant will not disenchant DETERMINATION or Shiny BASE cards. Pick a selection below, then adjust it by hand.',
    );
    const everything = [...calcCards({ shiny: false }), ...calcCards({ shiny: true })];
    const normal = buildColumn(everything, false);
    const shiny = buildColumn(everything, true);
    let confirm;

    function selected() {
      const counts = new Map();
      [...getChecked(normal), ...getChecked(shiny)].forEach(({ meta: { entry } }) => {
        counts.set(entry, (counts.get(entry) || 0) + 1);
      });
      return [...counts].map(([entry, quantity]) => ({ ...entry, quantity }));
    }

    function update() {
      const cards = selected();
      confirm.text(`Disenchant (+${calcDust(cards)})`).prop('disabled', !cards.length);
    }

    function select(cards = []) {
      const wanted = new Map(cards.map((card) => [cardKey(card), card.quantity]));
      const test = ({ meta }) => meta.copy <= (wanted.get(cardKey(meta.entry)) || 0);
      setChecked(normal, test);
      setChecked(shiny, test);
      update();
    }

    const buttons = $('<div class="us-disenchant-presets">').append(
      presets.map((preset) => $('<button type="button" class="btn btn-info btn-sm">')
        .text(`${preset.label} (+${calcDust(preset.cards)})`)
        .prop('disabled', !preset.cards.length)
        .hover(hover.show(preset.hint))
        .on('click', () => select(preset.cards))),
      $('<button type="button" class="btn btn-default btn-sm">')
        .text('Clear')
        .on('click', () => select()),
    );
    const view = $('<div class="us-disenchant-view">').append(
      $('<button type="button" class="btn btn-default btn-xs">')
        .text('Expand selected')
        .on('click', () => {
          revealChecked(normal);
          revealChecked(shiny);
        }),
      $('<button type="button" class="btn btn-default btn-xs">')
        .text('Collapse all')
        .on('click', () => {
          setAllCollapsed(normal, true);
          setAllCollapsed(shiny, true);
        }),
    );
    const columns = $('<div class="us-disenchant-columns">')
      .append($('<div class="us-disenchant-column">').append(normal))
      .append($('<div class="us-disenchant-column">').append(shiny))
      .on('change', 'input[type="checkbox"]', update);

    BootstrapDialog.show({
      title: 'Smart Disenchant',
      cssClass: 'mono underscript-dialog',
      message: $('<div>').append(
        $('<div class="us-disenchant-note">').html(`${note}`),
        buttons,
        view,
        columns,
      ),
      onshown(dialog) {
        confirm = dialog.getButton(CONFIRM);
        update();
      },
      onhide: hover.hide,
      buttons: [{
        id: CONFIRM,
        label: 'Disenchant (+0)',
        cssClass: 'btn-danger',
        action(dialog) {
          disenchant(selected());
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
    switch (Rarity.find(rarity)) {
      case Rarity.BASE:
      case Rarity.TOKEN:
      case Rarity.DETERMINATION: return false;
      case Rarity.LEGENDARY:
      case Rarity.EPIC:
      case Rarity.RARE:
      case Rarity.COMMON: return true;
      default:
        debugToast(`Unknown Rarity: ${rarity}`);
        return false;
    }
  }
});
