import eventManager from '../../utils/eventManager';
import style from '../../utils/style';

eventManager.on('ChatDetected', () => {
  // Fix chat window being all funky with sizes
  style.add('.chat-messages { height: calc(100% - 30px); }');
});
