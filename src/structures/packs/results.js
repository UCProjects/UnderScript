/* eslint-disable no-multi-assign, no-nested-ternary */
import { toast as basicToast } from 'src/utils/2.toasts';
import { window } from 'src/utils/1.variables';
import formatNumber from 'src/utils/formatNumber';
import length from 'src/utils/length';
import Rarity from 'src/structures/constants/rarity';

const rarity = [Rarity.DETERMINATION, Rarity.LEGENDARY, Rarity.EPIC, Rarity.RARE, Rarity.COMMON].map(String);
export default function showResults(packs, opened, { heading = 'Results', shinyPack = false } = {}) {
  const cardResults = {
    shiny: 0,
  };
  rarity.forEach((type) => {
    cardResults[type] = {};
  });
  opened.forEach((card) => { // Convert each card
    const r = cardResults[card.rarity];
    const c = r[card.name] = r[card.name] || { total: 0, shiny: 0, new: false };
    c.total += 1;
    if (card.new) c.new = true;
    if (card.shiny) {
      if (!shinyPack) {
        cardResults.shiny += 1;
      }
      c.shiny += 1;
    }
  });

  // Magic numbers, yep. Have between 6...26 cards showing
  let limit = Math.min(Math.max(Math.floor(window.innerHeight / 38), 6), 26);
  // Increase the limit if we don't have a specific rarity
  rarity.forEach((key) => {
    if (!length(cardResults[key])) {
      limit += 1;
    }
  });

  let text = '';
  // Build visual results
  rarity.forEach((key) => {
    const cards = cardResults[key];
    const keys = Object.keys(cards);
    if (!keys.length) return;
    const buffer = [];
    let count = 0;
    let shiny = 0;
    if (keys.length > limit) keys.sort((a, b) => cards[b].new - cards[a].new); // Push new cards to top of list if we have cards that'll get cut off
    keys.forEach((name) => {
      const card = cards[name];
      count += card.total;
      shiny += card.shiny;
      if (limit) {
        limit -= 1;
        buffer.push(`${card.new ? `<span class="yellow">{${$.i18n('cosmetics-new')}}</span>` : ''}${card.shiny ? '<span class="yellow">S</span> ' : ''}${name}${card.total > 1 ? ` (${formatNumber(card.total)}${card.shiny ? `, ${card.shiny}` : ''})` : ''}${limit ? '' : '...'}`);
      }
    });
    text += `${key} (${count}${shiny ? `, ${shiny} shiny` : ''}):${buffer.length ? `\n- ${buffer.join('\n- ')}` : ' ...'}\n`;
  });

  // Create result toast
  const total = opened.length;
  basicToast({
    // TODO: translation?
    title: `${heading}: ${formatNumber(packs)} Packs${cardResults.shiny ? ` (${total % 4 ? `${formatNumber(total)}, ` : ''}${formatNumber(cardResults.shiny)} shiny)` : total % 4 ? ` (${formatNumber(total)})` : ''}`,
    text,
    className: 'underscript-toast-inherit',
  });
}
