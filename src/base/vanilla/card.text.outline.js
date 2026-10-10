import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import VarStore from 'src/utils/VarStore';
import style from 'src/utils/style';
import Translation from 'src/structures/constants/translation';

const setting = settings.register({
  name: Translation.Setting('card.text.outline'),
  key: 'underscript.card.text.outline',
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
      '.card { text-shadow: -1px -1px black, 1px 1px black, -1px 1px black, 1px -1px black; }',
    ));
  }
}

eventManager.on(':preload', toggle);
