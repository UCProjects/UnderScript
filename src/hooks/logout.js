import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';

onPage('Disconnect', function logout() {
  eventManager.singleton.emit('logout');
});
