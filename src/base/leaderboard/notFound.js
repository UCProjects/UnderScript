import eventManager from 'src/utils/eventManager';
import { globalSet } from 'src/utils/global';
import { toast } from 'src/utils/2.toasts';

const toasts = {};
eventManager.on(':preload:leaderboard', () => {
  globalSet('findUserRow', function findUserRow(user) {
    const row = this.super(user);
    if (row === -1) {
      if (!toasts[user] || !toasts[user].exists()) {
        toasts[user] = toast({
          // TODO: translation
          title: 'Not ranked',
          text: `Unfortunately ${user} has not qualified to be ranked, or the user does not exist.`,
        });
      }
    }
    return row;
  });
});
