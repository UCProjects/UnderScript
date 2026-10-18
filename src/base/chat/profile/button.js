export const WEIGHT = Object.freeze({
  HIGH: 150,
  NORMAL: 100,
  LOW: 50,
});

export default class ProfileButton {
  #weight;

  constructor(name, { weight = WEIGHT.NORMAL } = {}) {
    this.name = name;
    this.#weight = weight;
  }

  get weight() {
    return this.#weight;
  }

  create(user, reference) {
    return true;
  }

  getLink(user, element, reference) {}

  getIcon(user, element, reference) {}

  getText(user, element, reference) {
    return this.name;
  }

  onMount(element, user, reference) {}
}
