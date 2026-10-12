import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';

wrap(() => {
  const name = 'logger';
  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptLogger> {
    const write = (key: keyof UnderScriptLogger) => (...args: unknown[]) => console[key]( // eslint-disable-line no-console
      `[%c${plugin.name}%c/${key}]`,
      'color: #436ad6;',
      'color: inherit;',
      ...args,
    );
    return Object.freeze({
      info: write('info'),
      error: write('error'),
      log: write('log'),
      warn: write('warn'),
      debug: write('debug'),
    });
  }

  registerModule(name, mod);
});
