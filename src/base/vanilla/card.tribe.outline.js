import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import VarStore from 'src/utils/VarStore';
import style from 'src/utils/style';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('card.tribe.outline'),
  key: 'underscript.card.tribe.outline',
  page: 'Library',
  default: true,
  onChange: toggle,
  category: Translation.CATEGORY_OUTLINE,
});
const art = new VarStore();

function toggle(add = setting.value()) {
  if (art.isSet()) {
    if (add) return;
    art.consume().remove();
  }
  if (add) {
    art.set(style.add(
      '.cardTribes .tribe { color: rgb(0, 0, 0); filter: drop-shadow(0px 0px) drop-shadow(0px 0px); }',
    ));
  }
}

eventManager.on(':preload', toggle);
