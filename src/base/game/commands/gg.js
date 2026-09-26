import eventManager from 'src/utils/eventManager.js';
import onPage from 'src/utils/onPage.js';
import rand from 'src/utils/rand.js';
import * as $el from 'src/utils/elementHelper.js';
import { register } from 'src/utils/chatCommands.js';

eventManager.on('ChatDetected', function goodGame() {
  const list = ['good game', 'gg', 'Good Game', 'Good game'];

  register({
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
