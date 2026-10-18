import * as api from 'src/utils/4.api';
import Constant from './constant';

export default class Soul extends Constant {
  #playable;

  constructor(name, { playable = true } = {}) {
    super(name);
    this.#playable = playable;
  }

  get playable() {
    return this.#playable;
  }

  static KINDNESS = new Soul('KINDNESS');
  static DETERMINATION = new Soul('DETERMINATION');
  static PATIENCE = new Soul('PATIENCE');
  static BRAVERY = new Soul('BRAVERY');
  static JUSTICE = new Soul('JUSTICE');
  static PERSEVERANCE = new Soul('PERSEVERANCE');
  static INTEGRITY = new Soul('INTEGRITY');
  static MONSTER = new Soul('MONSTER', { playable: false });
}

api.mod.soul = Object.fromEntries(Object.entries(Soul));
