import Translation from 'src/structures/constants/translation';
import wrap from 'src/utils/2.pokemon';
import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';

wrap(() => {
  const questSelector = 'input[type="submit"][value="Claim"]:not(:disabled)';

  function collectQuests() {
    const quests = document.querySelectorAll(questSelector);
    if (quests.length) {
      const block = getBlock();
      const table = block.querySelector('.questTable tbody');
      quests.forEach((quest) => {
        const row = quest.parentElement.parentElement.parentElement.cloneNode(true);
        if (row.childElementCount !== 4) {
          row.firstElementChild.remove();
        }
        table.append(row);
      });
      document.querySelector('#event-list').after(block);
    }
  }

  eventManager.on(':preload:Quests', collectQuests);
  // style.add('progress::before { content: attr(value) " / " attr(max); float: right; color: white; }');

  function getBlock() {
    const block = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.classList.add('event-title');
    h3.textContent = 'Completed Quests';
    const claimAll = document.createElement('button');
    claimAll.classList.add('btn', 'btn-success', 'btn-sm');
    claimAll.textContent = 'Claim All';
    claimAll.style.float = 'right';
    claimAll.hidden = settings.value('underscript.disable.questClaim');
    claimAll.addEventListener('click', () => {
      block.querySelectorAll(questSelector).forEach((button) => button.form.requestSubmit(button));
    });
    eventManager.on('underscript:ready', () => {
      h3.textContent = Translation.General('quest.pending');
      claimAll.textContent = Translation.General('quest.claimAll');
    });
    const table = document.createElement('table');
    table.classList.add('table', 'questTable');
    const tbody = document.createElement('tbody');
    table.append(tbody);
    block.append(claimAll, h3, table);
    return block;
  }
});
