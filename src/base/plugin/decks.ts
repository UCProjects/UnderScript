import wrap from 'src/utils/2.pokemon';
import { registerModule } from 'src/utils/plugin';
import decks from 'src/structures/deck/decks';
import type { SavedDeck } from 'src/structures/deck/saved';

type DecksEvent = keyof UnderScriptDecksEvents;

type DecksListener<K extends DecksEvent> = (
  this: UnderScriptEventMeta,
  ...args: UnderScriptDecksEvents[K]
) => unknown;

wrap(() => {
  const name = 'decks';

  function mod(plugin: UnderScriptPlugin): Readonly<UnderScriptDecksPlugin> {
    const views = new WeakMap<SavedDeck, UnderScriptSavedDeck>();

    function log(error: unknown, event: string, args: unknown[]) {
      plugin.logger.error(`Decks event error (${event}):\n`, error, '\n', JSON.stringify({ args }));
    }

    function wrapper<K extends DecksEvent>(fn: DecksListener<K>, event: K) {
      function listener(this: UnderScriptEventMeta, ...args: UnderScriptDecksEvents[K]) {
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

    function view(deck: SavedDeck): UnderScriptSavedDeck {
      let existing = views.get(deck);
      if (!existing) {
        const meta: UnderScriptDeckMeta = Object.freeze({
          get: (key) => deck.getMeta(plugin.name, key),
          set: (key, value) => deck.setMeta(plugin.name, key, value),
          remove: (key) => deck.removeMeta(plugin.name, key),
          all: () => deck.allMeta(),
          of: (other) => deck.metaOf(other),
        });
        existing = Object.freeze({
          get soul() {
            return deck.soul;
          },
          get index() {
            return deck.index;
          },
          get exists() {
            return deck.exists;
          },
          get cards() {
            return deck.cards;
          },
          get artifacts() {
            return deck.artifacts;
          },
          get name() {
            return deck.name;
          },
          set name(value) {
            deck.name = value;
          },
          get description() {
            return deck.description;
          },
          set description(value) {
            deck.description = value;
          },
          meta,
          load: () => decks.load(deck.soul, { cards: deck.cards, artifacts: deck.artifacts }),
          remove: () => deck.erase(),
        });
        views.set(deck, existing);
      }
      return existing;
    }

    const obj: UnderScriptDecksPlugin = {
      on(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        decks.on(event, wrapper(fn, event));
        return obj;
      },
      once(event, fn) {
        if (typeof fn !== 'function') throw new Error('Must pass a function');
        decks.once(event, wrapper(fn, event));
        return obj;
      },
      off(event, fn) {
        decks.off(event, fn);
        return obj;
      },
      saved: (soul) => decks.saved(soul).map(view),
      get: (soul, index) => {
        const deck = decks.get(soul, index);
        return deck && view(deck);
      },
      current: () => decks.current(),
      save: async (soul, slot) => view(await decks.save(soul, slot)),
      addCard: (soul, id, options) => decks.addCard(soul, id, options),
      removeCard: (soul, id, options) => decks.removeCard(soul, id, options),
      addArtifact: (soul, id) => decks.addArtifact(soul, id),
      clear: (soul) => decks.clear(soul),
      clearArtifacts: (soul) => decks.clearArtifacts(soul),
      load: (soul, deck) => decks.load(soul, deck),
    };

    return Object.freeze(obj);
  }

  registerModule(name, mod, 'logger');
});
