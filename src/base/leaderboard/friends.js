import eventManager from 'src/utils/eventManager';
import { global, globalSet } from 'src/utils/global';
import style from 'src/utils/style';
import onPage from 'src/utils/onPage';
import * as hover from 'src/utils/hover';
import Counter from 'src/utils/Counter';
import Toggle from 'src/utils/Toggle';
import VarStore from 'src/utils/VarStore';

const showFriends = new Toggle();
const ready = new Counter();
const friendRanks = [];
const pageNumber = new VarStore(-1);
const btn = new VarStore();

eventManager.once('Rankings:init', init);
eventManager.once('Chat:Connected', () => {
  if (onPage('leaderboard')) init();
});

function toggle() {
  showFriends.flip();
  localStorage.removeItem('rankedLeaderboardPage');
  global('setupLeaderboard')();
  btn.value?.classList.toggle('active', showFriends.value);
}

function init() {
  if (ready.value === -1) return;
  if (ready.next() !== 2) return;
  ready.set(-1);

  style.add('#navButtons > .active > .glyphicon-user { color: orange; }');

  globalSet('getMaxPage', function getMaxPage() {
    if (showFriends.value) return Math.floor((friendRanks.length - 1) / global('maxDisplayPage'));
    return this.super();
  });

  eventManager.on('preShowPage', function showPage(page) {
    if (showFriends.value) {
      show(page);
      this.canceled = true;
    }
  });

  globalSet('getUserPageNum', function getUserPageNum() {
    if (showFriends.value) return pageNumber.value;
    return this.super();
  });

  const button = document.createElement('button');
  btn.value = button;
  button.classList.add('btn', 'btn-primary');
  button.addEventListener('click', toggle);
  button.innerHTML = '<span class="glyphicon glyphicon-user green"></span>';

  document.querySelectorAll('button.btn-lg').forEach((el) => el.classList.remove('btn-lg'));
  document.querySelector('#navButtons').append(button);
  // TODO: translation
  hover.tip('Toggle friend rankings', button);

  const leaderboard = global('leaderboard');
  const selfId = global('sessionIdUser');

  const selfIndex = leaderboard.findIndex(({ id }) => id === selfId);
  if (selfIndex >= 0) {
    pageNumber.value = Math.floor(selfIndex / global('maxDisplayPage'));
    global('userPageNumbers').push(pageNumber.value);
  }

  const friends = global('selfFriends');
  friendRanks.push(...leaderboard
    .filter(({ id }) => id === selfId || friends.some(({ id: uid }) => id === uid))
    .map((i) => leaderboard.indexOf(i)));
}

function show(page = 0) {
  $('.leaderboardSlot').remove();
  $('#btnSelf').prop('disabled', true);
  $('#btnNext').prop('disabled', page === global('getMaxPage')());
  const addSlot = global('addLeaderboardSlot');
  const max = global('maxDisplayPage');
  const start = page * max;
  friendRanks
    .slice(start, start + max)
    .forEach((row) => addSlot(row));
}
