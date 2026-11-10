import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';
import { errorToast } from 'src/utils/2.toasts';
import onPage from 'src/utils/onPage';
import Toggle from 'src/utils/Toggle';

onPage('Play', setup);

const waiting = new Toggle();

function setup() {
  eventManager.on('socketOpen', (socket) => {
    socket.onclose = null;
    socket.addEventListener('close', announce);
    globalSet('onbeforeunload', function onbeforeunload() {
      socket.removeEventListener('close', announce);
      this.super();
    });
  });

  eventManager.on('Play:Message', (data) => {
    switch (data.action) {
      case 'getLeaveQueue':
        waiting.on();
        break;
      default:
        waiting.off();
    }
  });
}

// TODO: translation
function announce() {
  if (waiting.value) {
    eventManager.emit('closeQueues', 'Disconnected from queue. Please refresh page.');
  }
  errorToast({
    name: 'An Error Occurred',
    message: 'You have disconnected from the queue, please refresh the page.',
  });
}
