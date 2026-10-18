import * as api from 'src/utils/4.api';
import eventManager from 'src/utils/eventManager';
import Item from 'src/structures/constants/item';
import Priority from 'src/structures/constants/priority';
import Rarity from 'src/structures/constants/rarity';
import Soul from 'src/structures/constants/soul';

const constants = api.mod.constants;

Object.entries({ item: Item, priority: Priority, rarity: Rarity, soul: Soul }).forEach(([name, Kind]) => {
  constants[name] = Object.fromEntries(Object.entries(Kind));
});

['item', 'priority', 'rarity'].forEach((name) => {
  let warned = false;
  api.mod[name] = new Proxy(constants[name], {
    get(target, key, receiver) {
      if (!warned) {
        warned = true;
        console.warn(`'underscript.${name}' is deprecated, use 'underscript.constants.${name}' instead.`);
      }
      return Reflect.get(target, key, receiver);
    },
  });
});

Object.entries(Item).forEach((([key, value]) => {
  Object.defineProperty(constants, key, {
    get() {
      console.warn(`'underscript.constants.${key}' is deprecated, use 'underscript.constants.item.${key}' instead.`);
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
