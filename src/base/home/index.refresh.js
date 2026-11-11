import * as http from 'src/utils/http';
import * as settings from 'src/utils/settings/index';
import { infoToast } from 'src/utils/2.toasts';
import debugToast from 'src/utils/debugToast';
import onPage from 'src/utils/onPage';
import decrypt from 'src/utils/decrypt.emails';
import translate from 'src/utils/translate';
import eventManager from 'src/utils/eventManager';
import Translation from 'src/structures/constants/translation';
import Toggle from 'src/utils/Toggle';
import VarStore from 'src/utils/VarStore';

const setting = settings.register({
  name: Translation.Setting('gamelist.refresh'),
  key: 'undercards.disable.lobbyRefresh',
  default: false,
  category: Translation.CATEGORY_HOME,
  onChange(val) {
    onPage('', setup);
  },
});

const id = new VarStore();
const refreshing = new Toggle();

function clear() {
  if (id.value) {
    clearTimeout(id.value);
    id.reset();
  }
}

function refresh() {
  clear();
  if (refreshing.value || document.visibilityState === 'hidden' || setting.value()) return;
  refreshing.on();
  http.get('/').then((response) => {
    const data = decrypt($(response.data));
    const list = data.find('#liste');
    const live = $('#liste');
    live.find('tbody').html(translate(list.find('tbody')).html());
    live.prev('p').html(translate(list.prev()).html());
    eventManager.emit('Home:Refresh');
  }).catch((e) => {
    debugToast(`Index: ${e.message}`);
  }).then(() => {
    refreshing.off();
    setup();
  });
}

function setup(delay = 10000) {
  clear();
  id.value = setTimeout(refresh, delay);
}

onPage('', function refreshGameList() {
  // Restart refresh sequence when returning to page
  document.addEventListener('visibilitychange', refresh);
  // Queue initial refresh
  setup();
  const text = Translation.Toast('gamelist.refresh');
  infoToast(text, 'underscript.notice.refreshIndex', '1');
});
