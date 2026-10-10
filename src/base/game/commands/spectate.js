import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import { infoToast } from 'src/utils/2.toasts';
import { register } from 'src/utils/chatCommands';
import Translation from 'src/structures/constants/translation';

let toast;

register({
  command: 'spectate',
  usage: Translation.Command('spectate.usage'),
  note: Translation.Command('spectate.note'),
  enabled: () => (onPage('Game') || onPage('Spectate')) && global('finish', { throws: false }) === false,
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
