import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';

onPage('Disconnect', function logout() {
  eventManager.emit({ singleton: true }, 'logout');
});
