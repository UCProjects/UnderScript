import eventManager from 'src/utils/eventManager';
import onPage from 'src/utils/onPage';

eventManager.on(':preload', () => {
  if (onPage('Settings') || onPage('SignUp') || onPage('SignIn')) return;
  const type = 'input[type="text"]';
  [...document.querySelectorAll(type)].forEach((el) => {
    el.dataset.lpignore = true;
  });

  eventManager.on('Chat:getHistory', (data) => {
    document.querySelector(`#${data.room} ${type}`).dataset.lpignore = true;
  });
});
