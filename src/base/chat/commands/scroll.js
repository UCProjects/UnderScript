import { global } from 'src/utils/global';
import { debug } from 'src/utils/debug';
import { register } from 'src/utils/chatCommands';

register({
  command: 'scroll',
  handler(data) {
    debug('Scroll command');
    this.canceled = true;
    global('scroll')($(`#${data.room}`), true);
  },
});
