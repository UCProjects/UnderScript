import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import { register } from 'src/utils/chatCommands';
import { commandView } from 'src/structures/chat/outgoing';

type RawCommand = { command: string; text: string; [key: string]: any };

const NAME = /^[A-Za-z0-9_-]+$/;

wrap(() => {
  const name = 'commands';

  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptCommands> {
    const names = new Set<string>();

    function log(error: unknown, command: string) {
      plugin.logger.error(`Command error (/${command}):\n`, error);
    }

    function checkString(value: unknown, label: string) {
      if (value !== undefined && typeof value !== 'string') throw new Error(`Command ${label} must be a string`);
    }

    function checkFunction(value: unknown, label: string) {
      if (value !== undefined && typeof value !== 'function') throw new Error(`Command ${label} must be a function`);
    }

    const obj: UnderScriptCommands = {
      register(options) {
        if (typeof options !== 'object' || options === null) throw new Error('Command options must be provided');
        const { command, description, usage, icon, enabled, handler } = options;
        if (typeof command !== 'string' || !NAME.test(command)) {
          throw new Error('Command names can only contain letters, numbers, - and _');
        }
        if (names.has(command)) throw new Error(`Command "${command}" is already registered`);
        checkString(description, 'description');
        checkString(usage, 'usage');
        checkFunction(enabled, 'enabled');
        checkFunction(handler, 'handler');

        let reported = false;
        const handle = register({
          command,
          owner: plugin.name,
          description,
          usage,
          icon,
          enabled: enabled && (() => {
            try {
              return enabled() !== false;
            } catch (e) {
              if (!reported) log(e, command);
              reported = true;
              return false;
            }
          }),
          handler: handler && function run(this: UnderScriptEventMeta, data: RawCommand) {
            const view = commandView(data.room, data as Parameters<typeof commandView>[1], command);
            if (!view) return;
            try {
              const result = handler.call(this, view);
              if (result instanceof Promise) result.catch((e) => log(e, command));
            } catch (e) {
              log(e, command);
            }
          },
        });
        names.add(command);

        let removed = false;
        return Object.freeze({
          remove() {
            if (removed) return false;
            removed = true;
            names.delete(command);
            handle.remove();
            return true;
          },
        });
      },
    };

    return Object.freeze(obj);
  }

  registerModule(name, mod, 'logger');
});
