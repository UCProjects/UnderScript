import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';

eventManager.on(':preload:leaderboard', () => {
  globalSet('pageName', location.pathname.substr(1));
  globalSet('action', 'ranked');
  // TODO: Add other leaderboard hooks here?
});
