import Translation from 'src/structures/constants/translation';
import { window } from 'src/utils/1.variables';
import * as menu from 'src/utils/menu';

menu.addButton({
  text: Translation.Menu('gamelog'),
  action() {
    window.location = './gameUpdates.jsp';
  },
});
