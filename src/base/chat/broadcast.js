import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { infoToast } from 'src/utils/2.toasts';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('broadcast'),
  key: 'underscript.disable.broadcast',
  page: 'Chat',
});

eventManager.on('Chat:getMessageBroadcast', function broadcast({ message }) {
  if (setting.value()) return;
  infoToast({
    title: Translation.Toast('broadcast'),
    text: `<span style="color: #ff00ff;">${message}</span>`,
    footer: 'info-chan via UnderScript',
  });
});
