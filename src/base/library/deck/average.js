import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import * as hover from 'src/utils/hover';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('deck.average'),
  key: 'underscript.disable.deck.average',
  refresh: onPage('Decks'),
  page: 'Library',
});

// Calculate average
eventManager.on(':preload:Decks', () => {
  if (setting.value()) return;
  const label = $('<span>');
  const avg = $('<span>');
  $('#soulInfo span').after(label, ' ', avg).remove();

  function round(amt, dec = 2) {
    return Number.parseFloat(amt).toFixed(dec);
  }

  function count() {
    const list = global('decks')[global('soul')];
    const val = list.reduce((sum, { cost }) => sum + cost, 0);
    avg.text(`(${round(list.length ? val / list.length : val)})`);
  }

  eventManager.on('Deck:Soul Deck:Change Deck:Loaded', count);
  eventManager.on('underscript:ready', () => {
    label.text(Translation.General('passive'));
    avg.hover(hover.show(Translation.General('deck.average')));
  });
});
