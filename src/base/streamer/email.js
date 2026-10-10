import eventManager from 'src/utils/eventManager';
import * as $el from 'src/utils/elementHelper';
import streaming from './0.streamer';

eventManager.on(':preload:Settings', () => {
  if (!streaming()) return;
  $el.text.contains(document.querySelectorAll('p'), 'Mail :').forEach((e) => {
    // TODO: translation?
    e.innerText = 'Mail : <hidden>';
  });
});
