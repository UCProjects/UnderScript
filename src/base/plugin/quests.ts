import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import { getQuests, fetch } from 'src/utils/quests';

wrap(() => {
  const name = 'quests';
  function mod(): UnderScriptPluginQuests {
    return {
      getQuests,
      update(event = false) {
        return new Promise((res, rej) => {
          fetch(({ error, quests, previous }) => {
            if (error) {
              rej(error);
            } else {
              res({ quests: quests ?? [], previous: previous ?? [] });
            }
          }, event);
        });
      },
    };
  }

  registerModule(name, mod);
});
