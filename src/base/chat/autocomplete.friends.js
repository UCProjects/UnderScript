import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { global } from 'src/utils/global';
import * as user from 'src/utils/user';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('autocomplete.friends'),
  key: 'underscript.autocomplete.friends.online',
  page: 'Chat',
});

eventManager.on('@autocomplete', ({ list }) => {
  list.splice(0, 0, ...global('selfFriends')
    .filter(({ online }) => !setting.value() || online)
    .map(user.name)
    .filter((name) => !list.includes(name)));
});
