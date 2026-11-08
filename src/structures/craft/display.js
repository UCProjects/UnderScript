import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import showTotals from './totals';

function applyCard(response, change) {
  global('updateQuantity')(JSON.parse(response.card), change);
  showTotals(response);
}

function applyAuto(response) {
  const ids = JSON.parse(response.cardsId);
  const shinies = JSON.parse(response.cardsShiny);
  const quantities = JSON.parse(response.cardsQuantity);
  ids.forEach((id, index) => global('updateQuantities')(id, shinies[index], quantities[index]));
  $('#dust').text(response.dust);
  $('#totalDisenchant').text(0);
}

export function shownDust() {
  const dust = parseInt($('#dust').text(), 10);
  return Number.isNaN(dust) ? undefined : dust;
}

export function liveDust() {
  return onPage('Crafting') ? shownDust() : undefined;
}

export function apply(action, response) {
  if (!onPage('Crafting')) return;
  if (action === 'craft') applyCard(response, 1);
  if (action === 'disenchant') applyCard(response, -1);
  if (action === 'auto') applyAuto(response);
  global('applyFilters')();
  global('showPage')(global('currentPage'));
}
