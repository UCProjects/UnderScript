import eventManager from 'src/utils/eventManager.js';

eventManager.on(':preload', () => {
  const el = document.createElement('link');
  el.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
  el.rel = 'stylesheet';
  document.head.append(el);
});
