import decode from 'src/utils/decode';
import { showIn } from 'src/utils/hover';
import progress from './progress';

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function image(path, className) {
  const img = element('img', className);
  img.src = `images/${path}`;
  img.draggable = false;
  return img;
}

function asset({ image: name, extension } = {}) {
  return name ? `${name}.${extension || 'png'}` : undefined;
}

const masters = new Set(['MASTER', 'HIGH_MASTER', 'ULTIMATE_MASTER', 'LEGEND']);

function normalize(division) {
  return `${division}`.trim().toUpperCase().replaceAll(' ', '_');
}

export function useNotes(root, container) {
  root.querySelectorAll('[title]').forEach((el) => {
    const note = el.getAttribute('title');
    el.removeAttribute('title');
    if (!note) return;
    const show = showIn(container, note);
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', show);
  });
}

export default function createCard(user, details = {}) {
  const shown = { ...user.raw, ...details };
  const card = element('div', 'us-profile-card');
  const header = element('div', 'us-profile-header');

  const avatar = asset(shown.avatar);
  if (avatar) {
    const group = element('div', 'avatarGroup us-profile-avatar');
    group.append(image(`avatars/${avatar}`, `avatar ${shown.avatar.rarity ?? ''}`.trim()));
    if (shown.shinyAvatar ?? user.shinyAvatar) group.append(image('shinyAvatar.gif', 'rainbowAvatar'));
    header.append(group);
  }

  const banner = element('div', 'us-profile-banner');
  const skin = asset(shown.profileSkin);
  if (skin) banner.style.backgroundImage = `url('images/profiles/${skin}')`;

  const name = element('div', 'us-profile-name');
  const mainGroup = shown.mainGroup ?? user.mainGroup;
  const icon = mainGroup?.icon;
  if (icon) {
    const group = image(`${icon}.png`, 'us-profile-group');
    group.title = mainGroup.name;
    name.append(group);
  }
  name.append(element('span', '', decode(user.name)));

  const text = element('div', 'us-profile-text');
  text.append(name);
  if (shown.level !== undefined) text.append(element('div', 'us-profile-level', `LV ${shown.level}`));
  banner.append(text);

  const rank = normalize(shown.division || user.division || '');
  if (rank) {
    const division = element('div', 'us-profile-division');
    division.innerHTML = $.i18n(`{{DIVISION:${rank}}}`);
    if (masters.has(rank) && typeof shown.eloRanked === 'number') {
      division.append(element('span', `us-profile-elo ${rank}_COLOR`, `${shown.eloRanked}`));
    }
    const bar = progress(rank, shown.eloRanked);
    if (bar) {
      const meter = element('progress', `${rank.replace(/_(III|II|I)$/, '')}Bar us-profile-bar`);
      meter.min = 0;
      meter.max = bar.max;
      meter.value = bar.value;
      meter.title = `${shown.eloRanked} / ${bar.to}`;
      division.append(meter);
    }
    banner.append(division);
  }

  header.append(banner);
  const buttons = element('div', 'us-profile-buttons');
  card.append(header, buttons);
  return { card, buttons };
}
