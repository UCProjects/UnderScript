import each from '../../utils/each.js';
import eventManager from '../../utils/eventManager.js';
import { globalSet } from '../../utils/global.js';
import * as settings from '../../utils/settings/index.js';
import VarStore from '../../utils/VarStore.js';

const base = {
  key: 'underscript.safelink.',
  page: 'Chat',
  category: 'Trusted Domains',
};
const setting = settings.register({
  ...base,
  name: 'Enabled',
  default: true,
  key: 'underscript.enabled.safelink',
});

const safeLinks = new Set();

const cache = VarStore(false);

// Load blocked users
each(localStorage, (host, key) => {
  if (!key.startsWith(base.key)) return;
  register(host);
});

function register(host) {
  const s = settings.register({
    ...base,
    name: host,
    key: `${base.key}${host}`,
    type: 'remove',
  });
  if (s) {
    s.set(host);
    safeLinks.add(host);
  }
}

eventManager.on('BootstrapDialog:show', (dialog) => {
  if (dialog.getTitle() !== 'Leaving Warning' || !setting.value()) return;
  const host = cache.value;
  const after = dialog.options.buttons[0];
  dialog.options.buttons.unshift({
    label: `Trust ${host}`,
    cssClass: 'btn-danger',
    action(ref) {
      register(host);
      after.action(ref);
    },
  });
  dialog.updateButtons();
});

eventManager.on('ChatDetected', () => {
  // Add current domain to safe links
  safeLinks.add(location.hostname);

  globalSet('link', function link(l) {
    const url = new URL(l).hostname;
    // Allow going to page instantly if it's marked as a safe link
    if (setting.value() && safeLinks.has(url)) return true;
    // Cache the url for later
    cache.value = url;
    return this.super(l);
  });
});
