import eventManager from 'src/utils/eventManager.js';
import onPage from 'src/utils/onPage.js';
import * as hover from 'src/utils/hover.js';

onPage('Play', () => {
  let queues;
  let disable = true;
  let restarting = false;

  eventManager.on('jQuery', function onPlay() {
    restarting = $('p.infoMessage[data-i18n-custom="header-info-restart"]').length !== 0;
    if (disable || restarting) {
      queues = $('#standard-mode, #ranked-mode, button.btn.btn-primary');
      // TODO: translation
      closeQueues(restarting ? 'Joining is disabled due to server restart.' : 'Waiting for connection to be established.');
    }
  });

  eventManager.on('socketOpen', checkButton);

  eventManager.on('closeQueues', closeQueues);

  const timeout = setTimeout(() => {
    checkButton();
    // TODO: translation
    applyMessage('Auto enabled buttons, connection was not detected.');
  }, 10000);

  function checkButton() {
    disable = false;
    clearTimeout(timeout);
    if (queues && !restarting) {
      queues.off('.script');
      queues.toggleClass('closed', false);
      hover.hide();
    }
  }

  function closeQueues(message) {
    queues.toggleClass('closed', true);
    applyMessage(message);
  }

  function applyMessage(message) {
    queues
      .on('mouseenter.script', hover.show(message))
      .on('mouseleave.script', () => hover.hide());
  }
});
