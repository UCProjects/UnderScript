import eventManager from 'src/utils/eventManager';
import { parseGames } from 'src/structures/chat/games';
import { syncGames } from 'src/structures/chat/user';

function sync() {
  syncGames(parseGames(document));
}

eventManager.on(':load:', sync);
eventManager.on('Home:Refresh', sync);
