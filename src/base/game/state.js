import eventManager from 'src/utils/eventManager';
import wrap from 'src/utils/2.pokemon';
import game from 'src/structures/game/game';

eventManager.on('GameStart', () => {
  game.reset();
  eventManager.on('GameEvent', (data) => {
    wrap(() => game.apply(data), `Game[state]: ${data.action}`);
  });
});
