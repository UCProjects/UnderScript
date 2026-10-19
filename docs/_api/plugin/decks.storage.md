---
title: plugin.decks.storage
categories: plugin
parent: plugin.decks
---
The decks the player saved with UnderScript's deck storage buttons on the Decks page. They live in the browser.

Each one is a [saved deck](#saved-deck).

## Syntax
> plugin.decks.storage;

## Methods
list(*soul*)
: The decks saved in UnderScript's deck storage, as [saved decks](#saved-deck), ordered by soul and slot. Pass a soul such as `KINDNESS` to list just that soul. Only slots that hold a deck are listed.

get(*soul*, *slot*)
: One saved deck, or `undefined` if that slot has no deck. `slot` counts from `0`.

save(*soul*, *slot*)
: Save the deck the player has for a soul into a slot of UnderScript's deck storage, replacing what was there. A saved deck keeps its name, description and meta. Returns a promise of the [saved deck](#saved-deck). Rejects if the deck is empty.

import(*code*, { *slot*, *meta* })
: Save a deck code into UnderScript's deck storage and return the [saved deck](#saved-deck). It reads the game's deck code and the extra fields `export` adds: the name, the description, the meta and, if present, `cardShiny`. The soul comes from the code. `slot` is the slot to save into, replacing whatever it held, including its name, description and meta. Without `slot` it takes the first empty slot for that soul, which can be past the slots the storage buttons show (that depends on a setting). UnderScript's storage buttons do not show a deck there, and a warning is written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}). The same goes for a `slot` past them. Pass `meta: false` to leave the code's meta out. Throws `Invalid deck code` for a code the game's own import would refuse. The player's collection is not checked, so the deck can hold cards they do not own. A code can come from anyone, so treat the meta it brings in as untrusted.

## Saved deck
soul, index
: The soul and the slot the deck is saved in. You get the same object every time for the same slot.

exists
: Whether the slot still holds a deck. A deck you keep a reference to can be erased by the player.

cards, artifacts
: What is saved: `cards` is `{ id, shiny }` for each card and `artifacts` is the artifact ids. Both are empty if the slot has no deck.

name
: The name the player gave the deck, or `undefined`. Assign a string to change it, or `undefined` to clear it.

description
: A description for the deck, or `undefined`. Assign a string to change it, or `undefined` to clear it. The player does not see it in UnderScript.

meta
: Data your plugin keeps on the deck, see [meta](#meta).

load()
: Change the player's deck for this soul to this saved deck, like `decks.load`. Returns a promise of the list of changes made.

remove()
: Erase the saved deck, along with its name, description and every plugin's meta.

export({ *shiny* })
: A deck code for the saved deck, as a string. It is the game's own deck code, which is the base64 of `{ soul, cardIds, artifactIds }`, with `name`, `description` and `meta` added when the deck has them. `meta` is every plugin's data, as `{ pluginName: { key: value } }`. The game's Import accepts the code and ignores the extras. Like the game's code it has no shiny information by default, so shiny cards import as whichever copies the player prefers. Pass `{ shiny: true }` to add `cardShiny`, a list of `true` and `false` that lines up with `cardIds`, for importers that keep shinies. Throws if the deck is no longer saved.

### Meta
get(*key*), set(*key*, *value*), remove(*key*)
: Read, write and remove a value in your plugin's own data on this deck. A value can be anything that can be stored as JSON. `set` throws for a value that cannot.

all()
: Every plugin's data on this deck, as `{ pluginName: { key: value } }`

of(*plugin*)
: One plugin's data on this deck, as `{ key: value }`

You can read every plugin's meta, but only change your own. Meta is stored in the browser, with the saved decks, and is deleted when the player erases the deck from the storage buttons.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My great plugin');
const { storage } = plugin.decks;

// Remember a note on each saved deck
storage.list().forEach((deck) => {
  if (!deck.meta.get('seen')) deck.meta.set('seen', Date.now());
});

// Find the decks that hold a certain card
storage.list().filter(({ cards }) => cards.some(({ id }) => id === 175));

// Put a saved deck in play
storage.get('KINDNESS', 0)?.load().catch((error) => plugin.logger.warn(error.message));

// Save a deck code someone shared
const saved = storage.import(code);
plugin.logger.info(`Saved in slot ${saved.index + 1}`);
{% endhighlight %}
