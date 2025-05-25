import eventManager from 'src/utils/eventManager.js';
import onPage from 'src/utils/onPage.js';

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
