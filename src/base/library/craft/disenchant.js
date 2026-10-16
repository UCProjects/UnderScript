import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import { toast as fnToast } from 'src/utils/2.toasts';
import { debug } from 'src/utils/debug';
import debugToast from 'src/utils/debugToast';
import * as cardHelper from 'src/utils/cardHelper';
import onPage from 'src/utils/onPage';
import each from 'src/utils/each';
import hasOwn from 'src/utils/hasOwn';
import Translation from 'src/structures/constants/translation';
import Rarity from 'src/structures/constants/rarity';
import runQueue from 'src/utils/workQueue';
import { reportSmartDisenchant } from 'src/structures/craft/craft';
import { attempt } from 'src/structures/craft/request';
import * as hover from 'src/utils/hover';
import checkboxGroup, {
  getChecked,
  revealChecked,
  setAllCollapsed,
  setChecked,
} from 'src/utils/checkboxGroup';
import style from 'src/utils/style';
import showTotals from './totals';
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
      const label = Translation.Vanilla(`rarity-${rarity}`, titleCase(`${rarity}`)).translate();
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
    const status = $('<div class="sr-only" role="status" aria-live="polite">');
    let confirm;

    function selected() {
      const counts = new Map();
      [...getChecked(normal), ...getChecked(shiny)].forEach(({ meta: { entry } }) => {
        counts.set(entry, (counts.get(entry) || 0) + 1);
      });
      return [...counts].map(([entry, quantity]) => ({ ...entry, quantity }));
    }

    function update(announce = true) {
      const cards = selected();
      const dust = calcDust(cards);
      const copies = cards.reduce((total, { quantity }) => total + quantity, 0);
      confirm.text(`Disenchant (+${dust})`).prop('disabled', !cards.length);
      if (announce) status.text(`${copies} ${copies === 1 ? 'copy' : 'copies'} selected, +${dust} dust`);
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
      .on('change', 'input[type="checkbox"]', () => update());

    BootstrapDialog.show({
      title: 'Smart Disenchant',
      cssClass: 'mono underscript-dialog',
      message: $('<div>').append(
        $('<div class="us-disenchant-note">').html(`${note}`),
        buttons,
        view,
        columns,
        status,
      ),
      onshown(dialog) {
        dialog.getModal().on('keypress', (e) => {
          if (e.key === 'Enter') e.stopPropagation();
        });
        confirm = dialog.getButton(CONFIRM);
        update(false);
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

  function expand(cards) {
    return cards.flatMap(({ id, shiny, quantity }) => Array.from({ length: quantity }, () => ({ id, shiny })));
  }

  function attemptDisenchant({ id, shiny }) {
    return attempt({ action: 'disenchant', idCard: parseInt(id, 10), isShiny: shiny });
  }

  function progress({ done, skipped, failed, total, waitSeconds, stopping, inFlight }) {
    const bar = `<progress value="${done + skipped + failed}" max="${total}"></progress>`;
    if (stopping) return `${bar}<br>Stopping, waiting for ${inFlight} card${inFlight === 1 ? '' : 's'}`;
    if (waitSeconds > 0) return `${bar}<br>Rate limited, resuming in ${waitSeconds}s`;
    return bar;
  }

  function summary({ done, skipped, failed, stopped, total }, gained) {
    // TODO: translation
    if (!done && failed) return 'Could not complete disenchanting.';
    const details = [];
    if (skipped) details.push(`${skipped} skipped`);
    if (failed) details.push(`${failed} failed`);
    const extra = details.length ? ` (${details.join(', ')})` : '';
    if (stopped) return `Stopped disenchanting.\n+${gained} dust, ${done} of ${total} cards${extra}`;
    return `Finished disenchanting.\n+${gained} dust${extra}`;
  }

  function disenchant(cards) {
    if (!cards.length || processing) return;
    processing = true;
    const copies = expand(cards.splice(0));
    const startDust = parseInt($('#dust').text(), 10);
    let latest = null;
    let run;
    const disenchanted = new Map();
    const total = copies.length;
    // TODO: translation
    const toast = fnToast({
      title: `Disenchanting ${total} cards`,
      text: progress({ done: 0, skipped: 0, failed: 0, total, waitSeconds: 0, stopping: false, inFlight: 0 }),
      buttons: {
        text: 'Stop',
        dismiss: false,
        onClick: () => run?.stop(),
      },
    });
    debug(copies.length);
    run = runQueue({
      items: copies,
      concurrency: 5,
      attempt: attemptDisenchant,
      onOk(copy, response) {
        const key = `${copy.id}:${copy.shiny}`;
        disenchanted.set(key, { id: copy.id, shiny: copy.shiny, quantity: (disenchanted.get(key)?.quantity ?? 0) + 1 });
        global('updateQuantity')(JSON.parse(response.data.card), -1);
        // There's no guarantee these are in order
        if (!latest || response.data.dust > latest.data.dust) {
          latest = response;
          showTotals(response.data);
        }
      },
      onChange(state) {
        if (toast.exists()) toast.setText(progress(state));
      },
    });
    run.promise.then((result) => {
      toast.close('finished');
      if (latest) {
        global('applyFilters')();
        global('showPage')(global('currentPage'));
      }
      const gained = latest ? latest.data.dust - startDust : 0;
      fnToast(summary(result, gained));
      if (latest) {
        reportSmartDisenchant({
          cards: [...disenchanted.values()],
          dust: latest.data.dust,
          gained,
          stopped: result.stopped,
        });
      }
    }).catch((e) => {
      console.error(e); // eslint-disable-line no-console
      toast.close('failed');
      // TODO: translation
      fnToast('Could not complete disenchanting.');
    }).finally(() => {
      processing = false;
    });
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
