import eventManager from 'src/utils/eventManager';
import { debug } from 'src/utils/debug';
import debugToast from 'src/utils/debugToast';
import { eventExtra, eventName, eventRaw } from 'src/utils/debugFlags';
import wrap from 'src/utils/2.pokemon';
import game from 'src/structures/game/game';
import Toggle from 'src/utils/Toggle';

eventManager.on('GameStart', function gameEvents() {
  const finished = new Toggle();
  eventManager.on('GameEvent', function logEvent(data) {
    if (finished.value) { // Sometimes we get events after the battle is over
      debugToast(`Extra action: ${data.action}`, eventExtra);
      return;
    }
    debug(data.action, eventName);
    debug(data, eventRaw);
    wrap(() => game.apply(data), `Game[state]: ${data.action}`);
    const emitted = eventManager.emit(data.action, data).ran;
    if (!emitted) {
      debugToast(`Unknown action: ${data.action}`);
    }
  });
  eventManager.on('PreGameEvent', function callPreEvent(data) {
    if (finished.value) return;
    const event = eventManager.emit({ cancelable: this.cancelable }, `${data.action}:before`, data);
    if (!event.ran) return;
    this.canceled = event.canceled;
  });
  eventManager.on('getVictory getDefeat getResult', function finish() {
    finished.on();
  });
  eventManager.on('getBattleLog', (data) => {
    const log = JSON.parse(data.battleLog);
    const { ran } = eventManager.emit(`Log:${log.battleLogType}`, log);
    if (!ran) {
      debugToast(`Unknown action: Log:${log.battleLogType}`);
    }
  });
});
