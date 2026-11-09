import VarStore from './VarStore';

export default class Toggle extends VarStore<boolean> {
  constructor(value = false) {
    super(value);
  }

  on(): boolean {
    return this.set(true);
  }

  off(): boolean {
    return this.set(false);
  }

  flip(): boolean {
    return this.set(!this.get());
  }
}
