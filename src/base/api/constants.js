import * as api from 'src/utils/4.api';
import eventManager from 'src/utils/eventManager';
import Item from 'src/structures/constants/item';
import Priority from 'src/structures/constants/priority';
import Rarity from 'src/structures/constants/rarity';
import Soul from 'src/structures/constants/soul';

const constants = api.mod.constants;
Object.entries(Item).forEach((([key, value]) => {
  Object.defineProperty(constants, key, {
    get() {
      console.warn(`'underscript.constants.${key}' is deprecated, use 'underscript.item.${key}' instead.`);
      return value;
    },
  });
}));

constants.getItem = (value) => Item.find(value);
constants.isItem = (other) => Item.find(other) !== undefined;
constants.getPriority = (value) => Priority.find(value);
constants.isPriority = (other) => Priority.find(other) !== undefined;
constants.getRarity = (value) => Rarity.find(value);
constants.isRarity = (other) => Rarity.find(other) !== undefined;
constants.getSoul = (value) => Soul.find(value);
constants.isSoul = (other) => Soul.find(other) !== undefined;

eventManager.on('underscript:ready', () => {
  Item.lock();
  Priority.lock();
  Rarity.lock();
  Soul.lock();
});
