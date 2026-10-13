import eventManager from 'src/utils/eventManager';
import { emit as emitChat } from 'src/structures/chat/chat';
import { channelFromRoom } from 'src/structures/chat/message';

// TODO: Is this used?
let focused = false;

export default focused;

eventManager.on('Chat:getHistory', (data) => {
  const channel = channelFromRoom(data.room);
  $(`#${data.room} input[type="text"]`)
    .on('focusin.script', () => {
      focused = true;
      eventManager.emit('Chat:focused', data);
      if (channel) emitChat('focus', channel);
    })
    .on('focusout.script', () => {
      focused = false;
      eventManager.emit('Chat:unfocused', data);
      if (channel) emitChat('blur', channel);
    });
});
