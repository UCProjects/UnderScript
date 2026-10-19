---
title: plugin.decks
categories: plugin
plugin: true
property: true
---
Read and change the player's decks from any page, work with the decks saved in UnderScript's deck storage, and keep your own data on them. Errors thrown by your listeners are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}).

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

## Properties
{% assign children = site.api | where: "parent", "plugin.decks" %}
{% for page in children %}
<a href="{{ page.url | relative_url }}">{{ page.title }}</a>
: {{ page.excerpt }}
{% endfor %}

## Events
changed({ *soul*, *action*, *id*, *shiny* })
: The player's deck for a soul changed, after the server accepted it. It fires for the Decks page's own changes and for the methods above, once per change. `action` is `addCard`, `removeCard`, `removeAllCards`, `addArtifact` or `clearArtifacts`. `id` is the card or artifact, and `shiny` is for cards. Call `current()` for the new contents. It does not fire for a request the server refused.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My great plugin');
const { decks } = plugin;

decks.current().then(({ KINDNESS }) => plugin.logger.info(`${KINDNESS.cards.length} cards`));

decks.on('changed', ({ soul }) => plugin.logger.info(`Deck changed for ${soul}`));

// Build a deck
decks.load('KINDNESS', { cards: [{ id: 5 }, { id: 5 }, { id: 9, shiny: true }], artifacts: [2] });
{% endhighlight %}
