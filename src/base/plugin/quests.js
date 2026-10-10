import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import { getQuests, fetch } from 'src/utils/quests';

wrap(() => {
  const name = 'quests';
  function mod(plugin) {
    return {
      getQuests,
      update(event = false) {
        return new Promise((res, rej) => {
          fetch(({ error, ...rest }) => {
            if (error) {
              rej(error);
            } else {
              res({ ...rest });
            }
          }, event);
        });
      },
    };
  }

  registerModule(name, mod);
});
