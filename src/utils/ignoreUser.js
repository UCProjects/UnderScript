import Translation from 'src/structures/constants/translation';
import * as settings from './settings/index';

export default function ignoreUser(name, key, set = false) {
  const setting = settings.register({
    key,
    name,
    type: 'remove',
    page: 'Chat',
    category: Translation.CATEGORY_CHAT_IGNORED,
  });
  if (set) {
    setting.set(name);
  }
}
