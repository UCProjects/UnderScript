import Base from '../base';

export default class Storage extends Base {
  constructor(userId) {
    super({
      id: userId,
    });
  }

  get key() {
    return `underscript.deck.${this.id}`;
  }
}
