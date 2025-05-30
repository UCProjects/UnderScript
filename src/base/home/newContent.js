import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { dismissable } from 'src/utils/2.toasts.js';
import onPage from 'src/utils/onPage.js';
import cleanData from 'src/utils/cleanData.js';

const bundle = settings.register({
  name: 'Enable bundle toast',
  key: 'underscript.toast.bundle',
  default: true,
  refresh: () => onPage(''),
  category: 'Home',
  // TODO: Always hide bundles?
});
const skin = settings.register({
  name: 'Enable skin toast',
  key: 'underscript.toast.skins',
  default: true,
  refresh: () => onPage(''),
  category: 'Home',
});
const emotes = settings.register({
  name: 'Enable emote toast',
  key: 'underscript.toast.emotes',
  default: true,
  refresh: () => onPage(''),
  category: 'Home',
});
const quest = settings.register({
  name: 'Enable quest pass toast',
  key: 'underscript.toast.quests',
  default: true,
  refresh: () => onPage(''),
  category: 'Home',
});
const card = settings.register({
  name: 'Enable new Card toast',
  key: 'underscript.toast.cards',
  default: true,
  refresh: () => onPage(''),
  category: 'Home',
});

eventManager.on(':preload:', function toasts() {
  if (bundle.value()) toast('bundle');
  if (skin.value()) toast('skins');
  if (emotes.value()) toast('emotes');
  if (quest.value()) toast('quest');
  if (card.value()) toast('card');
});

function toast(type) {
  const names = [];
  const links = [];
  const sType = selector(type);
  [...document.querySelectorAll(`td a[href="${sType}"] img, p a[href="${sType}"] img, p img[class*="${sType}"]`)].forEach((el) => {
    names.push(imageName(el.src));
    let a = el.parentElement;
    while (a.parentElement !== a && a.nodeName !== 'TD' && a.nodeName !== 'P') a = a.parentElement;
    links.push(a.innerHTML);
    a.remove();
  });
  const prefix = `underscript.dismiss.${type}.`;
  const key = `${prefix}${names.join(',')}`;
  cleanData(prefix, key);
  if (settings.value(key)) return;
  dismissable({
    key,
    text: links.join('').replace(/\n/g, ''),
    title: title(type, links.length > 1),
  });
}

function title(type, plural = false) {
  switch (type) {
    case 'bundle': return 'New Bundle Available';
    case 'skins': return 'New Skins or Avatars';
    case 'emotes': return 'New Emotes Available';
    case 'quest': return 'New Quest Pass';
    case 'card': return `New Card${plural ? 's' : ''}`;
    default: throw new Error(`Unknown Type: ${type}`);
  }
}

function selector(type) {
  switch (type) {
    case 'bundle': return 'Bundle';
    case 'skins': return 'CardSkinsShop';
    case 'emotes': return 'CosmeticsShop';
    case 'quest': return 'Quests';
    case 'card': return 'card-preview';
    default: throw new Error(`Unknown Type: ${type}`);
  }
}

function imageName(src) {
  return src.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('.'));
}
