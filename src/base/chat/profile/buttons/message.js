import { global } from 'src/utils/global';
import { self, isMod } from 'src/utils/user';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register, WEIGHT } from '../index';
import isSelf from './self';

class Message extends ProfileButton {
  constructor() {
    super('message', { weight: WEIGHT.HIGH });
  }

  create(user) {
    return isMod(self()) && !isSelf(user);
  }

  getLink(user) {
    return () => global('openPrivateRoom')(user.id, user.name);
  }

  getIcon() {
    return 'glyphicon-envelope';
  }

  getText() {
    return `${Translation.General('message')}`;
  }
}

register(new Message());
