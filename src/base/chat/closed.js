import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';

eventManager.on('Chat:Disconnected', () => {
  $('.chat-box').each((i, e) => {
    global('scroll')($(e), true);
  });
});
