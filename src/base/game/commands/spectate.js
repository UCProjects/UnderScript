import eventManager from 'src/utils/eventManager.js';
import { global } from 'src/utils/global.js';
import onPage from 'src/utils/onPage.js';
import { infoToast } from 'src/utils/2.toasts.js';
import { register } from 'src/utils/chatCommands.js';

let toast;

register({
  command: 'spectate',
  usage: '[text (optional)]',
  note: '/spectate [text (optional)]<br/>Output:<br/>You vs Enemy: url [text]',
  enabled: () => onPage('Game') && global('finish', { throws: false }) === false,
  handler(data) {
    if (typeof gameId === 'undefined' || global('finish')) {
      this.canceled = true;
      return;
    }
    if (toast) toast.close();
    data.output = `${$('#yourUsername').text()} vs ${$('#enemyUsername').text()}: ${location.origin}/Spectate?gameId=${global('gameId')}&playerId=${global('userId')}${data.text ? ` - ${data.text}` : ''}`;
  },
});

eventManager.on('GameStart', () => {
  toast = infoToast({
    text: 'You can send a spectate URL in chat by typing /spectate',
    onClose() {
      toast = null;
    },
  }, 'underscript.notice.spectatecommand', '1');
});
