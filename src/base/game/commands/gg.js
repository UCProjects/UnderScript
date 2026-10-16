import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';
import rand from 'src/utils/rand';
import * as $el from 'src/utils/elementHelper';
import { registerWithSetting } from 'src/utils/chatCommands';

eventManager.on('ChatDetected', function goodGame() {
  const list = ['good game', 'gg', 'Good Game', 'Good game'];

  registerWithSetting({
    command: 'gg',
    enabled: () => onPage('Game'),
    handler(data) {
      if (typeof gameId === 'undefined') {
        this.canceled = true; // Don't send text
        return;
      }
      data.output = `@${$el.text.get(document.querySelector('#enemyUsername'))} ${list[rand(list.length)]}`; // Change the output
    },
  });
});
