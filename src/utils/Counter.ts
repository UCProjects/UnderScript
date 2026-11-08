import VarStore from './VarStore';

export default class Counter extends VarStore<number> {
  constructor(value = 0) {
    super(value);
  }

  add(step = 1): number {
    return this.set(this.get() + step);
  }

  next(step = 1): number {
    return this.add(step);
  }

  remove(step = 1): number {
    return this.set(this.get() - step);
  }
}
