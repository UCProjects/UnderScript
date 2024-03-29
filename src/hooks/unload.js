import eventManager from '../utils/eventManager.js';
import { getPageName } from '../utils/onPage.js';

eventManager.on(':loaded', () => {
  function unload() {
    eventManager.emit(':unload');
    eventManager.emit(`:unload:${getPageName()}`);
  }
  function last() {
    const chat = window.socketChat;
    if (chat && chat.readyState <= WebSocket.OPEN) chat.close();
  }
  window.onbeforeunload = unload;
  window.onunload = last;
});
