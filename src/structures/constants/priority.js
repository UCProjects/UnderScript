import * as api from 'src/utils/4.api.js';
import Constant from './constant.js';

export default class Priority extends Constant {
  static FIRST = new Priority('first', 'top');
  static HIGHEST = new Priority('highest');
  static HIGH = new Priority('high');
  static NORMAL = new Priority('normal');
  static LOW = new Priority('low');
  static LOWEST = new Priority('lowest');
  static LAST = new Priority('last', 'bottom');

  static get(value) {
    if (value instanceof Priority) return value;
    // eslint-disable-next-line no-use-before-define
    return values.find((v) => v.equals(value));
  }
}

const values = Object.values(Priority);

api.mod.priority = Object.fromEntries(Object.entries(Priority));
