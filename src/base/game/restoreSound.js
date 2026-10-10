import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';

// Restore sound on refresh
eventManager.once('getReconnection connect', () => {
  let playing = false;
  global('music').addEventListener('play', () => {
    playing = true;
  });
  function restoreSound() {
    if (playing || settings.value('gameMusicDisabled')) return;
    global('music').play();
  }
  document.addEventListener('click', restoreSound, { once: true, passive: true });
});
