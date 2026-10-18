import { global } from 'src/utils/global';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register } from '../index';

class Profile extends ProfileButton {
  constructor() {
    super('profile', { weight: 120 });
  }

  getLink(user, element, reference) {
    return () => global('getInfo')(reference);
  }

  getIcon() {
    return 'glyphicon-user';
  }

  getText() {
    return `${Translation.General('profile')}`;
  }
}

register(new Profile());
