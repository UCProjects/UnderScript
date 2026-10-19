import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';

eventManager.on(':preload:GamesList', () => {
  eventManager.emit({ singleton: true }, 'enterCustom');
  const socket = global('socket');
  const oHandler = socket.onmessage;
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const { action } = data;
    if (eventManager.emit({ cancelable: true }, `preCustom:${action}`, data).canceled) return;
    oHandler(event);
    eventManager.emit(`Custom:${action}`, data);
  };
});
