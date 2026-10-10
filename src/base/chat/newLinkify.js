import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import { globalSet } from 'src/utils/global';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('links'),
  key: 'underscript.disable.linkify',
  page: 'Chat',
});

eventManager.on('ChatDetected', () => {
  // TODO: check regex (linting errors)
  const regex = /\b((?:https?:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/gi;
  globalSet('linkify', function linkify(text) {
    if (setting.value()) {
      return this.super(text);
    }
    return text.replace(regex, (i, $1) => {
      const link = migrate(`${$1.substr(0, 4) !== 'http' ? 'http://' : ''}${$1}`);
      return `<a href="${link}" target="_blank" rel="noopener" onclick="return link('${link}') || false;">${$1}</a>`;
    });
  });
});

function migrate(link) {
  const goto = new URL(link);
  if (goto.hostname.endsWith('undercards.net')) {
    const host = location.hostname;
    // TODO: Account for stupid test server
    if (goto.hostname !== host) {
      goto.hostname = host;
    }
  }
  return goto.toString();
}
