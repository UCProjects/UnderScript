import eventManager from '../../../utils/eventManager.js';
import * as settings from '../../../utils/settings/index.js';
import { global } from '../../../utils/global.js';
import onPage from '../../../utils/onPage.js';
import * as hover from '../../../utils/hover.js';

const setting = settings.register({
  name: 'Disable deck average counter',
  key: 'underscript.disable.deck.average',
  refresh: onPage('Decks'),
  page: 'Library',
});

// Calculate average
eventManager.on(':preload:Decks', () => {
  if (setting.value()) return;
  const avg = $('<span>').hover(hover.show('Average gold cost'));
  $('#soulInfo span').after('<span>Passive</span> ', avg).remove();

  function round(amt, dec = 2) {
    return Number.parseFloat(amt).toFixed(dec);
  }

  function count() {
    let val = 0;
    const list = global('decks')[global('soul')];
    list.forEach(({ cost }) => val += cost); // eslint-disable-line no-return-assign
    avg.text(`(${round(list.length ? val / list.length : val)})`);
  }

  eventManager.on('Deck:Soul Deck:Change Deck:Loaded', count);
});
