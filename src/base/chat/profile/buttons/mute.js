import { global } from 'src/utils/global';
import { self, isMod } from 'src/utils/user';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register, close, createIcon, WEIGHT } from '../index';
import isSelf from './self';

const times = {
  1: '1s',
  60: '1m',
  600: '10m',
  3600: '1h',
  21600: '6h',
  43200: '12h',
  86400: '1d',
};
const defaultTime = '3600';

class Mute extends ProfileButton {
  constructor() {
    super('mute', { weight: WEIGHT.LOW });
  }

  create(user) {
    return isMod(self()) && !user.isMod && !isSelf(user);
  }

  getText() {
    return '';
  }

  onMount(element, user) {
    const action = document.createElement('button');
    action.type = 'button';
    element.classList.add('us-profile-mute');
    action.textContent = `${Translation.General('mute')}`;
    const select = document.createElement('select');
    Object.entries(times).forEach(([seconds, label]) => {
      const option = document.createElement('option');
      option.value = seconds;
      option.textContent = label;
      option.selected = seconds === defaultTime;
      select.append(option);
    });
    action.addEventListener('click', () => {
      global('timeout')(`${user.id}`, select.value);
      close();
    });
    element.append(createIcon('glyphicon-time'), action, select);
  }
}

register(new Mute());
