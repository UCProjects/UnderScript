import { loadGames } from 'src/structures/chat/games';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register } from '../index';
import isSelf from './self';

function fromMessage(reference) {
  const id = $(reference).data('infos')?.user?.gameId;
  return typeof id === 'number' && id >= 0 ? id : undefined;
}

function known(user, reference) {
  return user.isFriend ? user.gameId : fromMessage(reference);
}

function href(user, gameId) {
  return `/Spectate?gameId=${gameId}&playerId=${user.id}`;
}

class Spectate extends ProfileButton {
  constructor() {
    super('spectate', { weight: 200 });
  }

  create(user) {
    return !isSelf(user);
  }

  getLink(user, element, reference) {
    return href(user, known(user, reference));
  }

  getIcon() {
    return 'glyphicon-eye-open green';
  }

  getText() {
    return `${Translation.General('spectate', 'Spectate')}`;
  }

  onMount(element, user, reference) {
    element.hidden = known(user, reference) === undefined;
    if (user.isFriend || fromMessage(reference) === user.gameId) return;
    loadGames().then((games) => {
      const gameId = games.get(`${user.id}`);
      element.hidden = gameId === undefined;
      if (gameId !== undefined) element.querySelector('a').href = href(user, gameId);
    }).catch(() => {});
  }
}

register(new Spectate());
