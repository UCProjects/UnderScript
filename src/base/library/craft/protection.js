import * as api from 'src/utils/4.api';
import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';
import Toggle from 'src/utils/Toggle';

const locked = new Toggle();
const bypass = new Toggle();

const craft = api.mod.craft;

craft.bypassProtection = setBypass;

export default function setBypass(value) {
  bypass.value = value === true;
}

function override(...args) {
  if (locked.value && !bypass.value) return;
  locked.on();
  this.super(...args);
}

eventManager.on(':preload:Crafting', () => {
  globalSet('auto', override);
  globalSet('craft', override);
  globalSet('disenchant', override);
});

eventManager.on('Craft:auto Craft:disenchant craftcard crafterrror', () => {
  locked.off();
});
