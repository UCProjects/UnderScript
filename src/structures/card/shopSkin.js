import isTrue from 'src/utils/isTrue';
import Skin from './skin';

export default class ShopSkin extends Skin {
  #active = false;
  #cost = 0;
  #discount = 0;
  #owned = false;
  #unavailable = false;

  constructor({
    // Vanilla
    ucpCost = 0,
    // Ours
    active,
    discount,
    owned,
    unavailable,
    cost = ucpCost,
    ...data
  }) {
    super(data);
    this.#active = isTrue(active);
    this.#cost = Number(cost);
    this.#discount = Number(discount);
    this.#owned = isTrue(owned);
    this.#unavailable = isTrue(unavailable);
  }

  get active() {
    return this.#active;
  }

  get cost() {
    return this.#cost;
  }

  get discount() {
    return this.#discount;
  }

  get owned() {
    return this.#owned;
  }

  get unavailable() {
    return this.#unavailable;
  }
}
