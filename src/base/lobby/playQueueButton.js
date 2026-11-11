import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';
import * as hover from 'src/utils/hover';
import Toggle from 'src/utils/Toggle';
import VarStore from 'src/utils/VarStore';

onPage('Play', () => {
  const queues = new VarStore();
  const disable = new Toggle(true);
  const restarting = new Toggle();

  eventManager.on('jQuery', function onPlay() {
    restarting.value = $('p.infoMessage[data-i18n-custom="header-info-restart"]').length !== 0;
    if (disable.value || restarting.value) {
      queues.value = $('#standard-mode, #ranked-mode, button.btn.btn-primary');
      // TODO: translation
      closeQueues(restarting.value ? 'Joining is disabled due to server restart.' : 'Waiting for connection to be established.');
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
    disable.off();
    clearTimeout(timeout);
    if (queues.value && !restarting.value) {
      queues.value.off('.script');
      queues.value.toggleClass('closed', false);
      hover.hide();
    }
  }

  function closeQueues(message) {
    queues.value.toggleClass('closed', true);
    applyMessage(message);
  }

  function applyMessage(message) {
    queues.value
      .on('mouseenter.script', hover.show(message))
      .on('mouseleave.script', () => hover.hide());
  }
});
