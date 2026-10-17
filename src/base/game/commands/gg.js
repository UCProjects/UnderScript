import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';
import rand from 'src/utils/rand';
import * as $el from 'src/utils/elementHelper';
import plugin from 'src/utils/underscript';
import { commandSetting } from 'src/utils/chatCommands';

eventManager.on('ChatDetected', function goodGame() {
  const list = ['good game', 'gg', 'Good Game', 'Good game'];
  const setting = commandSetting('gg');

  plugin.commands.register({
    command: 'gg',
    enabled: () => !setting.value() && onPage('Game'),
    handler(command) {
      if (typeof gameId === 'undefined') {
        this.canceled = true; // Don't send text
        return;
      }
      command.output = `@${$el.text.get(document.querySelector('#enemyUsername'))} ${list[rand(list.length)]}`; // Change the output
    },
  });
});
