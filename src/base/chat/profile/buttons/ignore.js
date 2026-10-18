import * as settings from 'src/utils/settings/index';
import ignoreUser from 'src/utils/ignoreUser';
import { toast } from 'src/utils/2.toasts';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register, WEIGHT } from '../index';
import isSelf from './self';

const prefix = 'underscript.ignore.';

function keyOf(user) {
  return `${prefix}${user.id}`;
}

class Ignore extends ProfileButton {
  constructor() {
    super('ignore', { weight: WEIGHT.NORMAL });
  }

  create(user) {
    return !settings.value('underscript.disable.ignorechat') && !user.isMod && !isSelf(user);
  }

  getLink(user) {
    return () => {
      const key = keyOf(user);
      if (settings.value(key)) {
        settings.remove(key);
        return;
      }
      toast({
        text: Translation.IGNORED.translate(user.name),
        buttons: [{
          text: Translation.UNDO,
          onClick: () => settings.remove(key),
        }],
        className: ['dismissable', 'underscript-toast-danger'],
      });
      ignoreUser(user.name, key, true);
    };
  }

  getIcon(user) {
    return `glyphicon-volume-${settings.value(keyOf(user)) ? 'up' : 'off'}`;
  }

  getText(user) {
    return `${settings.value(keyOf(user)) ? Translation.General('unignore') : Translation.General('ignore')}`;
  }
}

register(new Ignore());
