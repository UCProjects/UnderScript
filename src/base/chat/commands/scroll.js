import { global } from 'src/utils/global.js';
import { debug } from 'src/utils/debug.js';
import { register } from 'src/utils/chatCommands.js';

register({
  command: 'scroll',
  handler(data) {
    debug('Scroll command');
    this.canceled = true;
    global('scroll')($(`#${data.room}`), true);
  },
});
