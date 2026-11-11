import eventManager from 'src/utils/eventManager';
import { infoToast } from 'src/utils/2.toasts';
import onPage from 'src/utils/onPage';
import VarStore from 'src/utils/VarStore';

onPage('Game', () => {
  const regex = /(^| )@o\b/gi;
  const toast = new VarStore();
  toast.value = infoToast('You can mention opponents with @o', 'underscript.notice.mention', '1');

  function convert({ input }) {
    toast.consume()?.close('processed');
    $(input).val($(input).val()
      .replace(regex, `$1@${$('#enemyUsername').text()}`));
  }
  eventManager.on('Chat:send', convert);

  eventManager.on('@autocomplete', ({ list = [] }) => {
    const name = $('#enemyUsername').text();
    if (!name) return;
    const pos = list.indexOf(name);
    if (pos > -1) { // Remove older entry
      list.splice(pos, 1);
    }
    list.push(name); // Put on top
  });
});
