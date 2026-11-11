import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';
import { debug } from 'src/utils/debug';
import onPage from 'src/utils/onPage';
import VarStore from 'src/utils/VarStore';
import hasOwn from 'src/utils/hasOwn';
import { window } from 'src/utils/1.variables';
import Toggle from 'src/utils/Toggle';
import changePage from '../vanilla/pageSelect';

function set(type, value, replace = true) {
  if (history.state &&
    hasOwn(history.state, type) &&
    history.state[type] === value) return;
  const func = replace && !userLast() ? history.replaceState : history.pushState;
  const o = {};
  o[type] = value;
  func.call(history, o, document.title, `?${type}=${value}`);
}

function load({ page, user } = {}) {
  if (user) {
    $('#searchInput').val(user).submit();
  } else if (page !== undefined) {
    changePage(page);
  }
}

function getData() {
  const params = new URLSearchParams(location.search);
  return Object.fromEntries(params.entries());
}

function userLast() {
  return history.state && history.state.user;
}

if (onPage('leaderboard')) {
  const data = getData();
  const skip = new VarStore(false);
  const ready = new Toggle();
  const replacePage = new VarStore();

  window.addEventListener('popstate', () => {
    if (!history.state) return;
    if (document.readyState === 'complete') load(history.state);
    else eventManager.on(':preload', () => debug('!!!pop unready'), load(history.state));
  });

  eventManager.on('Rankings:selectPage', () => {
    replacePage.value = false;
  });
  eventManager.on('Rankings:init', () => {
    load(data);
    ready.on();
  });

  eventManager.on(':preload', () => {
    eventManager.on('ShowPage', function showPage(page) {
      if (skip.consume() || !ready.value) return;
      set('page', page, replacePage.value);
      replacePage.reset();
    });

    globalSet('findUserRow', function findUserRow(user) {
      const row = this.super(user);
      skip.set(row !== -1);
      set('user', user, false);
      return row;
    });
  });

  eventManager.on('Rankings:selectPage', () => {
    replacePage.value = false;
  });
}
