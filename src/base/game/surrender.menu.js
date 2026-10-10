import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import * as menu from 'src/utils/menu';
import Translation from 'src/structures/constants/translation';

onPage('Game', () => {
  // Unbind the "surrender" hotkey
  eventManager.on('jQuery', () => {
    $(document).off('keyup');
  });
  function canSurrender() {
    return global('turn') >= 5 && global('gameType') !== 'STORY';
  }
  // Add the "surrender" menu button
  menu.addButton({
    text: Translation.Menu('surrender'),
    enabled: canSurrender,
    top: true,
    note: () => {
      if (!canSurrender()) {
        return Translation.Menu('surrender.note');
      }
      return undefined;
    },
    action: () => {
      const socket = global('socketGame');
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ action: 'surrender' }));
    },
  });
});
