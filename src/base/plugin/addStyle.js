import wrap from 'src/utils/2.pokemon';
import { newStyle } from 'src/utils/style';
import { registerModule } from 'src/utils/plugin';

wrap(() => {
  const name = 'addStyle';

  function mod(plugin) {
    const style = newStyle(plugin);
    return (...styles) => style.add(...styles);
  }

  registerModule(name, mod);
});
