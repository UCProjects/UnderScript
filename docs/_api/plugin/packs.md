---
title: plugin.packs
categories: plugin
plugin: true
property: true
---
Buy and open packs from any page, and listen to them being bought and opened. Errors thrown by your listeners are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}).

Buying and opening cost the player, so UnderScript always shows a toast with a **Stop** button while the packs are handled. A buy says which currency it is using. When it finishes, a second toast shows the result, unless a listener [cancels](#events) the event.

## Syntax
> plugin.packs;

## Methods
buy(*count*, { *type*, *gold* })
: Buy packs. Returns a promise of `{ count, requested, type, gold, stopped, error }`, where `count` is how many were bought. `count` is a whole number of at least 1, `type` is `''`, `'DR'` or `'UTY'` (default `''`), and `gold` is `true` to pay with gold and `false` to pay with UCP (default `true`). `error` is only there when the server refused.

open(*count*, *type*)
: Open packs. Returns a promise of `{ count, requested, type, cards, stopped, late, error }`, where `cards` is `{ id, name, rarity, shiny, new }` for every card opened, and `new` is whether you did not own it before. `type` is `''`, `'DR'`, `'UTY'`, `'Shiny'`, `'Super'` or `'Final'`, or its [item]({{ site.baseurl }}{% link _api/underscript/item.md %}), like `underscript.constants.item.DR_PACK` (default `''`).

on(*event*, *listener*), once(*event*, *listener*)
: Listen to a pack event. Returns `plugin.packs`.

off(*event*, *listener*)
: Stop listening

One purchase or opening runs at a time. Calling `buy` or `open` while another is running rejects with an `Error`, and so does a count or type that is not supported. The run is stopped when the server refuses an action, such as when you cannot afford the next pack, and what was done is returned with `error` set. If the server says to slow down, the run waits and carries on. On the Packs page, the pack counts, gold and UCP shown there are updated to match.

## Properties
buying: `boolean`
: `true` while packs are being bought

opening: `boolean`
: `true` while packs are being opened

## Events
bought({ *count*, *requested*, *type*, *gold*, *stopped*, *error* })
: A buy finished, was stopped, or was refused. Cancel the event, with `this.canceled = true`, to show the result yourself instead of UnderScript's toast.

opened({ *count*, *requested*, *type*, *cards*, *stopped*, *late*, *error* })
: An opening finished, was stopped, or was refused. Cancel the event to show the cards yourself instead of UnderScript's toast. `late` is `true` for packs that answered after a stopped run had given up waiting, which come together in one event.

rejected({ *action*, *message* })
: The server refused a request. `action` is the one that was sent, such as `addPackUcp`.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My great plugin');
const { packs } = plugin;

// Buy 5 packs with gold, from any page
packs.buy(5)
  .then(({ count }) => plugin.logger.info(`Bought ${count} packs`))
  .catch((error) => plugin.logger.warn(error.message));

// Open every Deltarune pack, then look at what came out
packs.open(10, underscript.constants.item.DR_PACK)
  .then(({ cards }) => cards.filter(({ rarity }) => rarity === 'LEGENDARY'));

// Show your own results
packs.on('opened', function onOpened({ count, cards }) {
  this.canceled = true;
  plugin.logger.info(`Opened ${count} packs for ${cards.length} cards`);
});
{% endhighlight %}
