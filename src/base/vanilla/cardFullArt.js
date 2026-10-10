import Translation from 'src/structures/constants/translation';
import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import style from 'src/utils/style';
import VarStore from 'src/utils/VarStore';

const setting = settings.register({
  name: Translation.Setting('skins.full'),
  key: 'underscript.hide.full-skin',
  page: 'Library',
  onChange: toggle,
  category: Translation.CATEGORY_CARD_SKINS,
});
const art = new VarStore();

function toggle() {
  if (art.isSet()) {
    art.consume().remove();
  } else {
    art.set(style.add(
      '.full-skin .cardHeader, .full-skin .cardFooter { background-color: rgb(0, 0, 0); }',
    ));
  }
}

eventManager.on(':preload', () => {
  if (setting.value()) toggle();
});
