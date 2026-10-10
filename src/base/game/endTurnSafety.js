import eventManager from 'src/utils/eventManager';
import { global, globalSet } from 'src/utils/global';

eventManager.on('PlayingGame', function fixEndTurn() {
  eventManager.on(':load', () => {
    let endedTurn = false;
    globalSet('endTurn', function endTurn() {
      if (endedTurn || $('#endTurnBtn').prop('disabled')) return;
      if (eventManager.cancelable.emit('player:endTurn').canceled) return;
      endedTurn = true;
      this.super();
    });

    eventManager.on('getTurnStart', function turnStarted() {
      if (global('userTurn') !== global('userId')) return;
      endedTurn = false;
    });
  });
});
