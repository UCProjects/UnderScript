import { global } from 'src/utils/global';
import onPage from 'src/utils/onPage';

onPage('GamesList', function keepAlive() {
  setInterval(() => {
    const socket = global('socket');
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ ping: 'pong' }));
  }, 5000);
});
