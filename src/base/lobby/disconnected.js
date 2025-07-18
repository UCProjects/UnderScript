import eventManager from 'src/utils/eventManager.js';
import { globalSet } from 'src/utils/global.js';
import { errorToast } from 'src/utils/2.toasts.js';
import onPage from 'src/utils/onPage.js';

onPage('Play', setup);

let waiting = true;

function setup() {
  eventManager.on('socketOpen', (socket) => {
    socket.addEventListener('close', announce);
    globalSet('onbeforeunload', function onbeforeunload() {
      socket.removeEventListener('close', announce);
      this.super();
    });
  });

  eventManager.on('Play:Message', (data) => {
    switch (data.action) {
      case 'getLeaveQueue':
        waiting = true;
        break;
      default:
        waiting = false;
    }
  });
}

// TODO: translation
function announce() {
  if (waiting) {
    eventManager.emit('closeQueues', 'Disconnected from queue. Please refresh page.');
  }
  errorToast({
    name: 'An Error Occurred',
    message: 'You have disconnected from the queue, please refresh the page.',
  });
}
