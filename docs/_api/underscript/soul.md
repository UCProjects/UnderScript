---
title: underscript.soul
categories: underscript
property: true
---
Names for the souls. Compare against these instead of writing the text yourself. Anywhere one is accepted you can also pass its name as text, such as `'BRAVERY'`.

## Syntax
> underscript.soul.*NAME*;

KINDNESS, DETERMINATION, PATIENCE, BRAVERY, JUSTICE, PERSEVERANCE, INTEGRITY
: The souls a player can build a deck for

MONSTER
: The soul monsters use. Players can't play it, but it is a soul all the same, so it shows up where the game names one.

Every soul has `playable`, which is `false` for `MONSTER` and `true` for the rest, `equals(other)`, and turns into the game's text for that soul when used as text. To turn text into a soul, or check if something is one, use [underscript.constants]({{ site.baseurl }}{% link _api/underscript/constants.md %}). The [`plugin.decks`]({{ site.baseurl }}{% link _api/plugin/decks.md %}) methods take a soul, or its text.

## Examples
{% highlight javascript %}
const { soul } = underscript;

if (soul.MONSTER.equals(deck.soul)) {
  console.log('Not a deck a player made');
}

underscript.plugin('My great plugin').decks.storage.list(soul.BRAVERY);
{% endhighlight %}
