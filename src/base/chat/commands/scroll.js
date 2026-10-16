import { global } from 'src/utils/global';
import { debug } from 'src/utils/debug';
import { registerWithSetting } from 'src/utils/chatCommands';

registerWithSetting({
  command: 'scroll',
  handler(data) {
    debug('Scroll command');
    this.canceled = true;
    global('scroll')($(`#${data.room}`), true);
  },
});
