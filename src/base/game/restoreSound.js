import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import Toggle from 'src/utils/Toggle';

// Restore sound on refresh
eventManager.once('getReconnection connect', () => {
  const playing = new Toggle();
  global('music').addEventListener('play', () => {
    playing.on();
  });
  function restoreSound() {
    if (playing.value || settings.value('gameMusicDisabled')) return;
    global('music').play();
  }
  document.addEventListener('click', restoreSound, { once: true, passive: true });
});
