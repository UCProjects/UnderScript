import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import style from 'src/utils/style';
import isCtrl from 'src/utils/isCtrl';
import wrap from 'src/utils/2.pokemon';
import { infoToast } from 'src/utils/2.toasts';
import { window } from 'src/utils/1.variables';
import { hide as hideNote } from 'src/utils/hover';
import { findUser } from 'src/structures/chat/user';
import Translation from 'src/structures/constants/translation';
import ProfileButton, { WEIGHT } from './button';
import createCard, { useNotes } from './card';
import place from './position';
import styles from './style.css';

export { ProfileButton, WEIGHT };

const setting = settings.register({
  name: Translation.Setting('chat.rightclick'),
  key: 'underscript.disable.chatContext',
  page: 'Chat',
});

export const clickSetting = settings.register({
  name: Translation.Setting('chat.leftclick'),
  note: Translation.Setting('chat.leftclick.note'),
  key: 'underscript.chat.leftclick',
  page: 'Chat',
  default: false,
});

const attribute = 'data-underscript-user';
const buttons = [];
let popup;
let visible = false;
let toast;

export function register(button) {
  if (!(button instanceof ProfileButton)) throw new Error('Expected a ProfileButton');
  buttons.push(button);
  buttons.sort((a, b) => b.weight - a.weight);
}

function native() {
  return typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.showPopover === 'function';
}

function outside(event) {
  if (popup && !popup.contains(event.target)) close();
}

function escape(event) {
  if (event.key === 'Escape') close();
}

function getPopup() {
  if (popup?.isConnected) return popup;
  popup = document.createElement('div');
  popup.id = 'underscript-profile';
  if (native()) {
    popup.setAttribute('popover', 'auto');
    popup.addEventListener('toggle', ({ newState }) => {
      visible = newState === 'open';
    });
  } else {
    popup.hidden = true;
  }
  document.body.append(popup);
  return popup;
}

function show() {
  if (native()) {
    popup.showPopover();
  } else {
    popup.hidden = false;
    document.addEventListener('mousedown', outside, true);
    document.addEventListener('keydown', escape, true);
  }
  visible = true;
}

export function close() {
  hideNote();
  if (!visible || !popup) return;
  visible = false;
  if (native()) {
    popup.hidePopover();
  } else {
    popup.hidden = true;
    document.removeEventListener('mousedown', outside, true);
    document.removeEventListener('keydown', escape, true);
  }
}

export function createIcon(spec) {
  if (!spec) return undefined;
  const icon = document.createElement('span');
  icon.className = 'us-profile-icon';
  icon.setAttribute('aria-hidden', 'true');
  if (spec.startsWith('glyphicon-')) icon.classList.add('glyphicon', ...spec.split(/\s+/));
  else icon.textContent = spec;
  return icon;
}

function fill(el, icon, text) {
  if (icon) el.append(icon);
  const label = document.createElement('span');
  label.className = 'us-profile-label';
  if (text instanceof Element) label.append(text);
  else label.textContent = text;
  el.append(label);
}

function mount(list, user, reference) {
  buttons.forEach((button) => wrap(() => {
    if (!button.create(user, reference)) return;
    const item = document.createElement('div');
    item.className = 'us-profile-button';
    const link = button.getLink(user, item, reference);
    const text = button.getText(user, item, reference);
    const icon = createIcon(button.getIcon(user, item, reference));
    if (typeof link === 'string') {
      const anchor = document.createElement('a');
      anchor.href = link;
      fill(anchor, icon, text);
      item.append(anchor);
    } else if (typeof link === 'function') {
      const action = document.createElement('button');
      action.type = 'button';
      action.addEventListener('click', (event) => {
        if (link.call(button, event) !== false) close();
      });
      fill(action, icon, text);
      item.append(action);
    } else {
      fill(item, icon, text);
    }
    list.append(item);
    button.onMount(item, user, reference);
  }, `Profile Button[${button.name}]`));
}

export function open(user, { clientX: x, clientY: y }, reference) {
  close();
  if (toast) toast.close('opened');
  const el = getPopup();
  const { card, buttons: list } = createCard(user, $(reference).data('infos')?.user);
  el.replaceChildren(card);
  mount(list, user, reference);
  useNotes(card, el);
  show();
  const { width, height } = el.getBoundingClientRect();
  const { left, top } = place({ x, y }, { width, height }, {
    width: window.innerWidth,
    height: window.innerHeight,
  });
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function userAt(event) {
  const reference = event.target instanceof Element ? event.target.closest(`[${attribute}]`) : null;
  const user = reference && findUser(reference.getAttribute(attribute));
  return user ? { user, reference } : undefined;
}

function pointer(event, reference) {
  if (event.detail !== 0) return event;
  const { left, bottom } = reference.getBoundingClientRect();
  return { clientX: left, clientY: bottom };
}

function onContextMenu(event) {
  if (isCtrl(event) || setting.value()) return;
  const found = userAt(event);
  if (!found) return;
  event.preventDefault();
  open(found.user, event, found.reference);
}

function onClick(event) {
  if (event.button !== 0 || isCtrl(event) || !clickSetting.value()) return;
  const found = userAt(event);
  if (!found) return;
  event.preventDefault();
  event.stopPropagation();
  open(found.user, pointer(event, found.reference), found.reference);
}

function mark({ id, user }, room) {
  let info = $(`#${room} #message-${id} #info-${user.id}`);
  if (!info.length) info = $(`#${room} #message-${id} #info-${id}`);
  info.attr(attribute, user.id);
}

style.add(styles);
document.addEventListener('contextmenu', onContextMenu, true);
document.addEventListener('click', onClick, true);

eventManager.on('Chat:getHistory', (data) => {
  JSON.parse(data.history).forEach((message) => mark(message, data.room));
});

eventManager.on('Chat:getMessage', function parse(data) {
  if (this.canceled) return;
  mark(JSON.parse(data.chatMessage), data.room);
});

eventManager.on('ChatDetected', () => {
  toast = infoToast({
    text: Translation.Toast('ignore.info'),
    onClose: () => {
      toast = null;
    },
  }, 'underscript.ignoreNotice', '1');
});
