import { global } from 'src/utils/global';
import { debug } from 'src/utils/debug';
import plugin from 'src/utils/underscript';
import { commandSetting } from 'src/utils/chatCommands';

const setting = commandSetting('scroll');

plugin.commands.register({
  command: 'scroll',
  enabled: () => !setting.value(),
  handler(command) {
    debug('Scroll command');
    this.canceled = true;
    global('scroll')($(`#${command.channel.room}`), true);
  },
});
