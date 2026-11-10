import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';
import game from 'src/structures/game/game';
import compound from 'src/utils/compoundEvent';
import VarStore from 'src/utils/VarStore';

compound([game, ':playing'], ':load', function fixEndTurn() {
  const endedTurn = new VarStore(false);
  globalSet('endTurn', function endTurn() {
    if (endedTurn.value || $('#endTurnBtn').prop('disabled')) return;
    const canceled = eventManager.emit({ cancelable: true }, 'player:endTurn').canceled;
    if (game.emit({ cancelable: true, canceled }, 'player:endTurn').canceled) return;
    endedTurn.value = true;
    this.super();
  });

  game.on('turn', (_, mine) => {
    if (!mine) return;
    endedTurn.value = false;
  });
});
