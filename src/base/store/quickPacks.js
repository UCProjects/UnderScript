import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import * as hover from 'src/utils/hover';
import * as api from 'src/utils/4.api';
import isCtrl from 'src/utils/isCtrl';
import packs, { checkOpen } from 'src/structures/packs/packs';

onPage('Packs', function quickOpenPack() {
  let autoOpen = false;

  function showCards() {
    const show = global('revealCard', 'show');
    $('.slot .cardBack').each((i, e) => { show(e, i); });
  }

  function available(type) {
    return Number($(`#nb${type}Packs`).text());
  }

  function click(event) {
    const button = event.target.closest?.('[id^="btnOpen"]');
    if (!button) return;
    if (packs.opening || packs.buying) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    const type = button.id.substring(7);
    autoOpen = isCtrl(event);
    if (event.shiftKey) {
      event.stopPropagation();
      event.preventDefault();
      const count = available(type);
      if (count > 0) {
        packs.open(count, type);
        hover.hide();
      }
    } else if (autoOpen || available(type) === 1) {
      hover.hide();
    }
  }

  document.addEventListener('click', click, true);

  eventManager.on('jQuery', () => {
    $(document).ajaxComplete((event, xhr, s) => {
      if (s.url !== 'PacksConfig' || !s.data || !autoOpen) return;
      const data = xhr.responseJSON;
      if (data?.action === 'getCards' && data.cards && !data.status) showCards();
    });
    $('[id^="btnOpen"]').on('mouseenter.script', hover.show(`<span style="font-style: italic;">
        * CTRL Click to auto reveal one (1) pack<br />
        * Shift Click to auto open ALL packs
      </span>`)).on('mouseleave.script', hover.hide);
  });

  api.register('openPacks', (count, type = '') => {
    if (packs.opening || packs.buying) throw new Error('Currently opening packs');
    const { type: kind } = checkOpen(count, type);
    const amount = Math.min(count, available(kind));
    if (!(amount > 0)) return undefined;
    return packs.open(amount, kind);
  });

  api.register('openingPacks', () => packs.opening);
}, 'quickPacks');
