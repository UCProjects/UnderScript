import eventManager from 'src/utils/eventManager';
import { global, globalSet } from 'src/utils/global';

eventManager.on(':preload:leaderboard', () => {
  const misread = global('action') !== 'ranked';
  globalSet('pageName', location.pathname.substr(1));
  globalSet('action', 'ranked');
  if (misread) {
    globalSet('maxDisplayPage', 10);
    global('refreshLeaderboard')(global('latestMonster'));
  }
  // TODO: Add other leaderboard hooks here?
});
