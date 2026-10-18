---
title: underscript.constants
categories: underscript
property: true
---
Holds the [items]({{ site.baseurl }}{% link _api/underscript/item.md %}), [priorities]({{ site.baseurl }}{% link _api/underscript/priority.md %}), [rarities]({{ site.baseurl }}{% link _api/underscript/rarity.md %}) and [souls]({{ site.baseurl }}{% link _api/underscript/soul.md %}) as named values, and helpers for working with them when you are not sure what you were given. The helpers accept an item, priority, rarity or soul, or the text for one, like `'gold'`, `'high'`, `'DT'` or `'BRAVERY'`.

## Syntax
> underscript.constants.getItem(*value*);<br>
> underscript.constants.isItem(*value*);<br>
> underscript.constants.getPriority(*value*);<br>
> underscript.constants.isPriority(*value*);<br>
> underscript.constants.getRarity(*value*);<br>
> underscript.constants.isRarity(*value*);<br>
> underscript.constants.getSoul(*value*);<br>
> underscript.constants.isSoul(*value*);

getItem
: Returns the matching `underscript.constants.item`, or `undefined` if there isn't one.

isItem
: `true` if the value is an item, or the text for one.

getPriority
: Returns the matching [`underscript.constants.priority`]({{ site.baseurl }}{% link _api/underscript/priority.md %}), or `undefined` if there isn't one.

isPriority
: `true` if the value is a priority, or the text for one.

getRarity
: Returns the matching [`underscript.constants.rarity`]({{ site.baseurl }}{% link _api/underscript/rarity.md %}), or `undefined` if there isn't one.

isRarity
: `true` if the value is a rarity, or the text for one.

getSoul
: Returns the matching [`underscript.constants.soul`]({{ site.baseurl }}{% link _api/underscript/soul.md %}), or `undefined` if there isn't one.

isSoul
: `true` if the value is a soul, or the text for one.

## Examples
{% highlight javascript %}
const { constants } = underscript;
const { item } = constants;

constants.getItem('gold') === item.GOLD; // true
constants.isItem('not an item'); // false

constants.getPriority('high') === constants.priority.HIGH; // true

constants.getRarity('DT') === constants.rarity.DETERMINATION; // true

constants.getSoul('BRAVERY') === constants.soul.BRAVERY; // true
{% endhighlight %}
