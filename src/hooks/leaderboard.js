import eventManager from 'src/utils/eventManager.js';
import { globalSet } from 'src/utils/global.js';

eventManager.on(':preload:leaderboard', () => {
  globalSet('pageName', location.pathname.substr(1));
  globalSet('action', 'ranked');
  // TODO: Add other leaderboard hooks here?
});
