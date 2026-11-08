import VarStore from './VarStore';

export default class Counter extends VarStore<number> {
  constructor(value = 0) {
    super(value);
  }

  next(step = 1): number {
    return this.set(this.get() + step);
  }

  add(step = 1): number {
    return this.next(step);
  }
}
