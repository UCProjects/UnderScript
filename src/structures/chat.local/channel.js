import Collection from 'src/utils/collection.js';
import Base from '../base.js';
import Message from './message.js';

export default class Channel extends Base {
  constructor(data, owner) {
    super(data);
    this.owner = owner;
    this.name = data.name;
    this.messages = new Collection(Message, 50);
    this.update(data);
  }

  update(data) {
    switch (data.action) {
      case 'getMessage':
      case 'getPrivateMessage':
        // TODO: Add new message
        break;
      default: break;
    }
  }

  sendMessage(message) {
    return this.owner.sendMessage(message, this);
  }
}
