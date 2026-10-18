---
title: plugin.decks
categories: plugin
plugin: true
property: true
---
Read and change the player's decks from any page, work with the decks saved in UnderScript's deck storage, and keep your own data on them. Errors thrown by your listeners are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}) instead of breaking other listeners.

The methods that change a deck work whether or not the player is on the Decks page, one at a time and in the order you called them, and they do not show the game's dialogs. If the server refuses a change, or the request fails, the promise rejects with an `Error` whose message is what the server said, already translated. When the server sends back nothing at all, which is what it does when you have no copies of a card left to add, the message is `The server sent an empty reply`. `load` stops at the first change that is refused and leaves the deck as it got to. On the Decks page, the cards and artifacts shown there are updated to match, for whichever soul changed.

The existing `Deck:*` [events]({{ site.baseurl }}{% link _api/events.md %}) are unchanged.

A soul is passed as its text, such as `'BRAVERY'`, or as an [underscript.constants.soul]({{ site.baseurl }}{% link _api/underscript/soul.md %}). The `soul` you get back, on a saved deck or in a change, is always text.

## Syntax
> plugin.decks;

## Methods
current()
: The decks the player has set up for each soul. Returns a promise of an object keyed by soul, such as `{ KINDNESS: { soul, cards, artifacts } }`. `cards` is `{ id, shiny }` for each card in the deck, and `artifacts` is the artifact ids. On the Decks page it reads the page, anywhere else it asks the server.

addCard(*soul*, *id*, { *shiny* }), removeCard(*soul*, *id*, { *shiny* })
: Add or remove one copy of a card in the deck for a soul. `shiny` defaults to `false`. Returns a promise of `{ soul, action, id, shiny }`.

addArtifact(*soul*, *id*), clearArtifacts(*soul*)
: Add an artifact to the deck for a soul, or remove all of its artifacts. Returns a promise of `{ soul, action, id }`, or `{ soul, action }` for `clearArtifacts`.

clear(*soul*)
: Remove every card and artifact from the deck for a soul. Returns a promise of `{ soul, action }`.

load(*soul*, { *cards*, *artifacts* })
: Change the deck for a soul to exactly this: `cards` is `{ id, shiny }` for each card and `artifacts` is artifact ids. It only sends the changes needed. Returns a promise of the list of changes it made, which is empty when the deck already matched. A deck holds at most 25 cards and 2 artifacts, and anything over that rejects before anything is changed.

on(*event*, *listener*), once(*event*, *listener*)
: Listen to a decks event. Returns `plugin.decks`.

off(*event*, *listener*)
: Stop listening

## Storage
The decks the player saved with UnderScript's deck storage buttons on the Decks page. They live in the browser, and each is a [saved deck](#saved-deck). `plugin.decks.storage` has these methods:

storage.list(*soul*)
: The decks saved in UnderScript's deck storage, as [saved decks](#saved-deck), ordered by soul and slot. Pass a soul such as `KINDNESS` to list just that soul. Only slots that hold a deck are listed.

storage.get(*soul*, *slot*)
: One saved deck, or `undefined` if that slot has no deck. `slot` counts from `0`.

storage.save(*soul*, *slot*)
: Save the deck the player has for a soul into a slot of UnderScript's deck storage, replacing what was there. A saved deck keeps its name, description and meta. Returns a promise of the [saved deck](#saved-deck). Rejects if the deck is empty.

storage.import(*code*, { *slot*, *meta* })
: Save a deck code into UnderScript's deck storage and return the [saved deck](#saved-deck). It reads the game's deck code and the extra fields `export` adds: the name, the description, the meta and, if present, `cardShiny`. The soul comes from the code. `slot` is the slot to save into, replacing whatever it held, including its name, description and meta. Without `slot` it takes the first empty slot for that soul. That can be past the slots the storage buttons show, which depends on a setting. UnderScript's own storage buttons would not show that deck, so the player may not be able to see it, and a warning is written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}). It does the same for a `slot` past them. A plugin that shows saved decks itself does not have that limit. Pass `meta: false` to leave the code's meta out. Throws `Invalid deck code` for a code the game's own import would refuse. The player's collection is not checked, so the deck can hold cards they do not own. Note that a code can come from anyone, so treat the meta it brings in as untrusted.

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
: A description for the deck, or `undefined`. Assign a string to change it, or `undefined` to clear it. The player does not see it in UnderScript, it is there for plugins.

meta
: Data your plugin keeps on the deck, see [meta](#meta).

load()
: Change the player's deck for this soul to this saved deck, like `decks.load`. Returns a promise of the list of changes made.

remove()
: Erase the saved deck, along with its name, description and every plugin's meta.

export({ *shiny* })
: A deck code for the saved deck, as a string. It is the game's own deck code, which is the base64 of `{ soul, cardIds, artifactIds }`, with `name`, `description` and `meta` added when the deck has them. `meta` is every plugin's data, as `{ pluginName: { key: value } }`. The game's Import accepts the code and ignores the extras. Like the game's code it has no shiny information by default, so shiny cards import as whichever copies the player prefers. Pass `{ shiny: true }` to add `cardShiny`, a list of `true` and `false` that lines up with `cardIds`, for importers that keep shinies. The game's Import ignores it. Throws if the deck is no longer saved.

### Meta
get(*key*), set(*key*, *value*), remove(*key*)
: Read, write and remove a value in your plugin's own data on this deck. A value can be anything that can be stored as JSON. `set` throws for a value that cannot.

all()
: Every plugin's data on this deck, as `{ pluginName: { key: value } }`

of(*plugin*)
: One plugin's data on this deck, as `{ key: value }`

You can read every plugin's meta, but only change your own. Nothing stops a plugin from reaching into the browser's storage and writing to another's, so this is there to prevent mistakes, not to protect the data. Meta is stored in the browser, with the saved decks, and is deleted when the player erases the deck from the storage buttons.

## Events
changed({ *soul*, *action*, *id*, *shiny* })
: The player's deck for a soul changed, after the server accepted it. It fires for the Decks page's own changes and for the methods above, once per change. `action` is `addCard`, `removeCard`, `removeAllCards`, `addArtifact` or `clearArtifacts`. `id` is the card or artifact, and `shiny` is for cards. Call `current()` for the new contents. It does not fire for a request the server refused.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My great plugin');
const { decks } = plugin;

// Remember a note on each saved deck
decks.storage.list().forEach((deck) => {
  if (!deck.meta.get('seen')) deck.meta.set('seen', Date.now());
});

// Find the decks that hold a certain card
decks.storage.list().filter(({ cards }) => cards.some(({ id }) => id === 175));

decks.current().then(({ KINDNESS }) => plugin.logger.info(`${KINDNESS.cards.length} cards`));

decks.on('changed', ({ soul }) => plugin.logger.info(`Deck changed for ${soul}`));

// Put a saved deck in play
decks.storage.get('KINDNESS', 0)?.load().catch((error) => plugin.logger.warn(error.message));

// Save a deck code someone shared
const saved = decks.storage.import(code);
plugin.logger.info(`Saved in slot ${saved.index + 1}`);

// Build a deck
decks.load('KINDNESS', { cards: [{ id: 5 }, { id: 5 }, { id: 9, shiny: true }], artifacts: [2] });
{% endhighlight %}
