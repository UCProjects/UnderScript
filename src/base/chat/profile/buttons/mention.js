import decode from 'src/utils/decode';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register } from '../index';

class Mention extends ProfileButton {
  constructor() {
    super('mention', { weight: 110 });
  }

  getLink(user, element, reference) {
    return () => {
      const input = $(reference).closest('.chat-box').find('.chat-text');
      const text = input.val();
      const separator = text.length !== 0 && !text.endsWith(' ') ? ' ' : '';
      input.val(`${text}${separator}@${decode(user.name)} `).focus();
    };
  }

  getIcon() {
    return '@';
  }

  getText() {
    return `${Translation.General('mention')}`;
  }
}

register(new Mention());
