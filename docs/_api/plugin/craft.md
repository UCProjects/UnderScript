---
title: plugin.craft
categories: plugin
plugin: true
property: true
---
Craft and disenchant cards from any page, and listen to crafting. The methods and events work whether or not the player is on the Crafting page. Errors thrown by your listeners are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}) instead of breaking other listeners.

The existing `craftcard`, `crafterrror` and `Craft:*` [events]({{ site.baseurl }}{% link _api/events.md %}) are unchanged.

## Syntax
> plugin.craft;

## Methods
craft(*id*, { *shiny* })
: Craft one card. Returns a promise of `{ id, name, dust, shiny }`, where `dust` is what you have afterwards. `id` is the card's id, and `shiny` defaults to `false`.

disenchant(*id*, { *shiny* })
: Disenchant one copy of a card. Returns a promise with the same shape as `craft`.

autoDisenchant()
: Run the auto disenchant, which removes the extra copies above the limit. Returns a promise of `{ cards, dust }`, where `cards` is `{ id, shiny, owned }` for each card that changed, and `owned` is how many you have afterwards.

on(*event*, *listener*), once(*event*, *listener*)
: Listen to a crafting event. Returns `plugin.craft`.

off(*event*, *listener*)
: Stop listening

The methods go one at a time, in the order you called them, and they do not show the game's dialog. If the server refuses, or the request fails, the promise rejects with an `Error` whose message is what the server said, already translated. On the Crafting page, the cards and dust shown there are updated to match.

## Properties
dust: `number` or `undefined`
: The dust UnderScript last saw you have, or `undefined` before it has seen any. On the Crafting page it reads the dust shown there. On other pages it is what your last craft, disenchant or auto left you with, or what the page's own buttons and Smart Disenchant did, which is kept for the next page in the same tab for half an hour, so it can be out of date. Check it before crafting in a loop, or stop at the first `rejected`.

## Events
crafted({ *id*, *name*, *dust*, *shiny* })
: One card was crafted, from the page's buttons, Ctrl-click or `craft.craft()`. Ctrl-click crafts several copies by crafting one at a time, so it fires once for each.

disenchanted({ *id*, *name*, *dust*, *shiny* })
: One card was disenchanted, from the page's buttons or `craft.disenchant()`

smartDisenchanted({ *cards*, *dust*, *gained*, *stopped* })
: Smart Disenchant finished, or was stopped, after disenchanting at least one card. `cards` is `{ id, shiny, quantity }` for every card it disenchanted, `dust` is what you have afterwards, `gained` is the dust it added, and `stopped` is whether the player stopped it. It fires once at the end and not for each card.

autoDisenchanted({ *cards*, *dust* })
: The auto disenchant ran, from the page or `craft.autoDisenchant()`

rejected({ *action*, *message*, *status* })
: The server refused or failed a craft, disenchant or auto. `action` is `craft`, `disenchant` or `auto`, `message` is translated, and `status` is the server's, such as `errorMaintenance`.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My great plugin');
const { craft } = plugin;

// Craft a card from any page
craft.craft(1, { shiny: false })
  .then(({ name, dust }) => plugin.logger.info(`Crafted ${name}, ${dust} dust left`))
  .catch((error) => plugin.logger.warn(error.message));

// Hear about every craft, however it was started
craft.on('crafted', ({ name, shiny }) => plugin.logger.info('Crafted', shiny ? 'shiny' : '', name));

// Smart Disenchant says everything at the end
craft.on('smartDisenchanted', ({ cards, gained }) => {
  const total = cards.reduce((sum, { quantity }) => sum + quantity, 0);
  plugin.logger.info(`Disenchanted ${total} cards for ${gained} dust`);
});

craft.on('rejected', ({ action, message }) => plugin.logger.warn(`${action} failed: ${message}`));
{% endhighlight %}
