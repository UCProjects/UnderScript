---
title: underscript.constants.soul
categories: underscript
parent: underscript.constants
---
Names for the souls. Anywhere one is accepted you can also pass its name as text, such as `'BRAVERY'`.

## Syntax
> underscript.constants.soul.*NAME*;

KINDNESS, DETERMINATION, PATIENCE, BRAVERY, JUSTICE, PERSEVERANCE, INTEGRITY
: The souls a player can build a deck for

MONSTER
: The soul monsters use. Non-playable.

Every soul has `playable`, which is `false` for `MONSTER` and `true` for the rest, `equals(other)`, and turns into the game's text for that soul when used as text, including in JSON. To turn text into a soul, or check if something is one, use [underscript.constants]({{ site.baseurl }}{% link _api/underscript/constants.md %}). The [`plugin.decks`]({{ site.baseurl }}{% link _api/plugin/decks.md %}) methods take a soul, or its text.

## Examples
{% highlight javascript %}
const { soul } = underscript.constants;

if (soul.MONSTER.equals(deck.soul)) {
  console.log('Not a deck a player made');
}

underscript.plugin('My great plugin').decks.storage.list(soul.BRAVERY);
{% endhighlight %}
