import Base from '../base.js';

export default class User extends Base {
  constructor(data) {
    super(data);
    this.room = data.idRoom;
    this.update(data);
  }

  update(data) {
  }
}
