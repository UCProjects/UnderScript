import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';
import { debug } from 'src/utils/debug';
import onPage from 'src/utils/onPage';
import wrap from 'src/utils/2.pokemon';
import { window } from 'src/utils/1.variables';

onPage('Spectate', () => {
  eventManager.emit({ singleton: true }, 'GameStart');

  eventManager.on(':preload', () => {
    function callGameHooks(data, original) {
      const run = !eventManager.emit({ cancelable: true }, 'PreGameEvent', data).canceled;
      if (run) {
        wrap(() => original(data));
      }
      eventManager.emit('GameEvent', data);
    }

    function hookEvent(event) {
      callGameHooks(event, this.super);
    }

    if (undefined !== window.bypassQueueEvents) {
      globalSet('runEvent', hookEvent);
      globalSet('bypassQueueEvent', hookEvent);
    } else {
      debug(`You're a fool.`);
    }
  });
});
