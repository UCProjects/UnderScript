import { blankToast, toast } from 'src/utils/2.toasts';
import formatNumber from 'src/utils/formatNumber';
import { global } from 'src/utils/global';
import VarStore from 'src/utils/VarStore';
import showResults from './results';

const NAMES = {
  '': 'Pack',
  DR: 'DR Pack',
  UTY: 'UTY Pack',
  Shiny: 'Shiny Pack',
  Super: 'Super Pack',
  Final: 'Final Pack',
};

const COUNTERS = {
  pack: '#nbPacks',
  drPack: '#nbDRPacks',
  utyPack: '#nbUTYPacks',
  superPack: '#nbSuperPacks',
  shinyPack: '#nbShinyPacks',
  finalPack: '#nbFinalPacks',
};

function packs(count, type) {
  return `${formatNumber(count)} ${NAMES[type]}${count === 1 ? '' : 's'}`;
}

function currency(gold) {
  return gold ? 'Gold' : 'UCP';
}

function adjust(selector, delta) {
  document.querySelectorAll(selector).forEach((element) => {
    const value = Number(element.textContent);
    if (Number.isFinite(value)) element.textContent = Math.max(value + delta, 0);
  });
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

const lastPack = new VarStore([]);

function parseCards(data) {
  try {
    const cards = JSON.parse(data.cards ?? '[]');
    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

function sync(action, data) {
  const delta = action.startsWith('add') ? 1 : -1;
  if (COUNTERS[data.type]) {
    adjust(COUNTERS[data.type], delta);
    adjust('.nbPacksHeader', delta);
  }
  if (data.golds !== undefined) setText('#golds', data.golds);
  if (data.ucp !== undefined) setText('#ucp', data.ucp);
}

function message(text) {
  try {
    return `${global('translateFromServerJson', { throws: false })?.(text) ?? text}`;
  } catch {
    return text;
  }
}

function describe(result) {
  const notes = [];
  if (result.stopped) notes.push('Stopped early.');
  if (result.error !== undefined) notes.push(message(result.error) || 'The game refused the request.');
  return notes.join('<br>');
}

const progressToast = new VarStore(blankToast());

function bar(state) {
  const base = `<progress value="${state.done}" max="${state.total}"></progress>`;
  if (state.stopping) return `${base}<br>Stopping, waiting for ${formatNumber(state.inFlight)} request${state.inFlight === 1 ? '' : 's'}`;
  if (state.waitSeconds > 0) return `${base}<br>Rate limited, resuming in ${state.waitSeconds}s`;
  return base;
}

function title(run) {
  if (run.kind === 'buy') return `Buying ${packs(run.requested, run.type)} with ${currency(run.gold)}`;
  return `Opening ${packs(run.requested, run.type)}`;
}

export function start(run, stop) {
  progressToast.value = toast({
    title: title(run),
    text: `<progress value="0" max="${run.requested}"></progress>`,
    className: 'dismissable',
    buttons: {
      text: 'Stop',
      dismiss: false,
      onClick: stop,
    },
  });
}

export function progress(run, state) {
  if (progressToast.value.exists()) progressToast.value.setText(bar(state));
}

export function end() {
  progressToast.value.close();
}

export function apply(action, data) {
  sync(action, data);
  if (action.startsWith('open')) lastPack.value = parseCards(data);
}

function showLastPack() {
  const append = global('appendCard', { throws: false });
  const reveal = global('revealCard', 'show', { throws: false });
  const hoverable = global('makeHoverable', { throws: false });
  if (typeof append !== 'function' || typeof reveal !== 'function' || !document.querySelector('.slot')) return;
  $('.slot').empty();
  lastPack.value.forEach((card, index) => {
    const slot = $(`#cardPos${index}`);
    const back = $('<div>')
      .addClass(['cardBack', 'NORMAL', card.extension, card.shiny && 'shiny-card'].filter(Boolean).join(' '))
      .attr({ 'data-name': card.name, 'data-rarity': card.rarity, onclick: `revealCard(this, ${index})` });
    slot.append(back);
    append(card, slot);
    $('#cardsOpen .card:last').addClass(`pos${index}`).hide();
  });
  if (typeof hoverable === 'function') hoverable();
  $('.slot .cardBack').each((index, element) => { reveal(element, index); });
}

export function bought(result) {
  toast({
    title: `Bought ${packs(result.count, result.type)} with ${currency(result.gold)}`,
    text: describe(result),
    className: 'underscript-toast-inherit',
  });
}

export function opened(result) {
  if (result.count) {
    showResults(result.count, result.cards, {
      heading: result.late ? 'Late results' : 'Results',
      shinyPack: result.type === 'Shiny',
    });
    if (!result.late) showLastPack();
  }
  const note = describe(result);
  if (note) {
    toast({
      title: `Opened ${packs(result.count, result.type)}`,
      text: note,
      className: 'underscript-toast-inherit',
    });
  }
}
