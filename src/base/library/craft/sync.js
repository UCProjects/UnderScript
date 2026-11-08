import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';
import { rememberDust } from 'src/structures/craft/craft';
import { shownDust } from 'src/structures/craft/display';

onPage('Crafting', () => {
  eventManager.on('jQuery', () => {
    const dust = shownDust();
    if (dust !== undefined) rememberDust(dust);
  });
});
