import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';
import { infoToast } from 'src/utils/2.toasts';
import plugin from 'src/utils/underscript';
import { commandSetting } from 'src/utils/chatCommands';
import Translation from 'src/structures/constants/translation';

let toast;

const setting = commandSetting('spectate', { note: Translation.Command('spectate.note') });

plugin.commands.register({
  command: 'spectate',
  usage: Translation.Command('spectate.usage'),
  enabled: () => !setting.value() && (onPage('Game') || onPage('Spectate')) && global('finish', { throws: false }) === false,
  handler(command) {
    if (typeof gameId === 'undefined' || global('finish')) {
      this.canceled = true;
      return;
    }
    if (toast) toast.close();
    command.output = `${$('#yourUsername').text()} vs ${$('#enemyUsername').text()}: ${location.origin}/Spectate?gameId=${global('gameId')}&playerId=${global('userId')}${command.text ? ` - ${command.text}` : ''}`;
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
