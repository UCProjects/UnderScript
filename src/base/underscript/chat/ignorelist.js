import each from 'src/utils/each';
import eventManager from 'src/utils/eventManager';
import ignoreUser from 'src/utils/ignoreUser';

eventManager.on(':load', () => {
  each(localStorage, (name, key) => {
    if (!key.startsWith('underscript.ignore.')) return;
    ignoreUser(name, key);
  });
});
