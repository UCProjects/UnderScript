import eventManager from '../../../utils/eventManager.js';
import * as settings from '../../../utils/settings/index.js';
import onPage from '../../../utils/onPage.js';
import rand from '../../../utils/rand.js';
import * as $el from '../../../utils/elementHelper.js';

eventManager.on('ChatDetected', function goodGame() {
  const list = ['good game', 'gg', 'Good Game', 'Good game'];
  const command = 'gg';
  const setting = settings.register({
    name: `Disable ${command} command`,
    key: `underscript.command.${command}`,
    note: `/${command}`,
    page: 'Chat',
    category: 'Commands',
  });

  if (!onPage('Game')) return;
  eventManager.on('Chat:command', function ggCommand(data) {
    if (this.canceled || data.command !== command || setting.value()) return;
    if (typeof gameId === 'undefined') {
      this.canceled = true; // Don't send text
      return;
    }
    data.output = `@${$el.text.get(document.querySelector('#enemyUsername'))} ${list[rand(list.length)]}`; // Change the output
  });
});
