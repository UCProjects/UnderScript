import eventManager from '../../utils/eventManager.js';
import * as settings from '../../utils/settings/index.js';
import * as api from '../../utils/4.api.js';
import { toast } from '../../utils/2.toasts.js';
import * as menu from '../../utils/menu.js';

const silent = 'Yes (silent)';
const disabled = 'No';
const mode = settings.register({
  name: 'Enable?',
  key: 'underscript.streamer',
  note: 'Enables a button on the menu, streamer mode is "off" by default.',
  options: ['Yes', silent, disabled],
  default: disabled,
  onChange: (val) => {
    if (val === disabled) {
      update(false);
    } else {
      menu.dirty();
    }
  },
  type: 'select',
  category: 'Streamer Mode',
});
const setting = settings.register({
  key: 'underscript.streaming',
  hidden: true,
});
api.register('streamerMode', streaming);
menu.addButton({
  text: () => `Streamer Mode: ${streaming() ? 'On' : 'Off'}`,
  hidden: () => mode.value() === disabled,
  action: () => update(!streaming()),
});
eventManager.on(':preload', alert);

function alert() {
  if (!streaming() || mode.value() === silent) return;
  toast('Streamer Mode Active');
}

function update(value) {
  setting.set(value);
  menu.dirty();
  alert();
}

export default function streaming() {
  return setting.value();
}
