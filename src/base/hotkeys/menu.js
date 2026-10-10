import { hotkeys } from 'src/utils/1.variables';
import Hotkey from 'src/utils/hotkey.class';
import length from 'src/utils/length';
import * as menu from 'src/utils/menu';

hotkeys.push(new Hotkey('Open Menu', () => {
  if (typeof BootstrapDialog !== 'undefined' && length(BootstrapDialog.dialogs)) {
    return;
  }
  if (menu.isOpen()) {
    menu.close();
  } else {
    menu.open();
  }
}, {
  keys: ['Escape'],
}));
