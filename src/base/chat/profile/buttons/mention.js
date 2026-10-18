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
      let text = input.val();
      if (text.length !== 0 && !text.endsWith(' ')) text += ' ';
      text += `@${decode(user.name)} `;
      input.val(text).focus();
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
