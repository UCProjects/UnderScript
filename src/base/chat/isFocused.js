import eventManager from 'src/utils/eventManager';
import { channelFromRoom, emit as emitChat } from 'src/structures/chat/chat';
import Toggle from 'src/utils/Toggle';

// TODO: Is this used?
const focused = new Toggle();

export default focused;

eventManager.on('Chat:getHistory', (data) => {
  const channel = channelFromRoom(data.room);
  $(`#${data.room} input[type="text"]`)
    .on('focusin.script', () => {
      focused.on();
      eventManager.emit('Chat:focused', data);
      if (channel) emitChat('focus', channel);
    })
    .on('focusout.script', () => {
      focused.off();
      eventManager.emit('Chat:unfocused', data);
      if (channel) emitChat('blur', channel);
    });
});
