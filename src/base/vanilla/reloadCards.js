import Translation from 'src/structures/constants/translation';
import eventManager from 'src/utils/eventManager';
import { global } from 'src/utils/global';
import * as menu from 'src/utils/menu';

eventManager.on(':preload', () => {
  const fetchAllCards = global('fetchAllCards', { throws: false });
  if (!fetchAllCards) return;
  menu.addButton({
    text: Translation.Menu('reload'),
    action() {
      localStorage.removeItem('cardsVersion');
      fetchAllCards();
    },
  });
});
