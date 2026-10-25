import axios from 'axios';
import * as settings from 'src/utils/settings/index';
import eventManager from 'src/utils/eventManager';
import wrap from 'src/utils/2.pokemon';
import { toast } from 'src/utils/2.toasts';
import { fetch, getQuests } from 'src/utils/quests';
import Translation from 'src/structures/constants/translation';

wrap(() => {
  const setting = settings.register({
    name: Translation.Setting('quest.claim'),
    key: 'underscript.disable.questClaim',
  });

  const pending = new Set();

  function isClaim(form, submitter) {
    return submitter?.value === 'Claim' && new URL(form.action, location.href).pathname === '/Quests';
  }

  function markClaimed(questId) {
    document.querySelectorAll('form').forEach((form) => {
      if (form.elements.questId?.value === questId) {
        if (form.elements.deleteDailyQuest) {
          form.remove();
        } else {
          form.querySelectorAll('input[type="submit"]').forEach((button) => button.remove());
        }
      }
    });
  }

  function notify(questId, reward) {
    const quest = getQuests().find(({ id }) => `${id}` === questId);
    toast({
      title: new Translation('toast.quest.claimed', { fallback: 'Claimed Quest' }),
      text: `${quest?.name ?? ''}<br>${reward?.innerHTML ?? ''}`,
    });
  }

  function claim(form, submitter) {
    const body = new FormData(form, submitter);
    const questId = body.get('questId');
    if (pending.has(questId)) return;
    pending.add(questId);
    const reward = form.closest('tr')?.querySelector('td:nth-last-child(2)');
    axios.post(form.action, new URLSearchParams(body)).then(() => {
      notify(questId, reward);
      markClaimed(questId);
      fetch();
    }).catch((error) => {
      console.error(error);
      form.submit();
    }).finally(() => {
      pending.delete(questId);
    });
  }

  eventManager.on(':preload:Quests', () => {
    document.addEventListener('submit', (event) => {
      const { target: form, submitter } = event;
      if (setting.value() || !isClaim(form, submitter)) return;
      event.preventDefault();
      claim(form, submitter);
    });
  });
});
