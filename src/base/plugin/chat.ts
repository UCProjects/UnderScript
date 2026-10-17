import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import chat from 'src/structures/chat/chat';

type ChatEvent = keyof UnderScriptChatEvents;

type ChatListener<K extends ChatEvent> = (
  this: UnderScriptEventMeta,
  ...args: UnderScriptChatEvents[K]
) => unknown;

wrap(() => {
  const name = 'chat';

  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptChat> {
    function log(error: unknown, event: string, args: unknown[]) {
      plugin.logger.error(`Chat event error (${event}):\n`, error, '\n', JSON.stringify({ args }));
    }

    function wrapper<K extends ChatEvent>(fn: ChatListener<K>, event: K) {
      function listener(this: UnderScriptEventMeta, ...args: UnderScriptChatEvents[K]) {
        try {
          const val = fn.call(this, ...args);
          if (val instanceof Promise) {
            return val.catch((error) => log(error, event, args));
          }
          return val;
        } catch (e) {
          log(e, event, args);
        }
        return undefined;
      }
      listener.plugin = plugin;
      listener.original = fn;
      return listener;
    }

    const obj: UnderScriptChat = {
      get connected() {
        return chat.connected;
      },
      get replaced() {
        return chat.replaced;
      },
      get channels() {
        return chat.channels;
      },
      on(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        chat.on(event, wrapper(fn, event));
        return obj;
      },
      once(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        chat.once(event, wrapper(fn, event));
        return obj;
      },
      off(event, fn) {
        chat.off(event, fn);
        return obj;
      },
      reconnect: () => chat.reconnect(),
      channel: (target) => chat.channel(target),
      send: (channel, text) => chat.send(channel, text),
    };

    return Object.freeze(obj);
  }

  registerModule(name, mod, 'logger');
});
