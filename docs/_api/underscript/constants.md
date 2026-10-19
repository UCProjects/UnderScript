---
title: underscript.constants
categories: underscript
property: true
---
Holds the [items]({{ site.baseurl }}{% link _api/underscript/item.md %}), [priorities]({{ site.baseurl }}{% link _api/underscript/priority.md %}), [rarities]({{ site.baseurl }}{% link _api/underscript/rarity.md %}) and [souls]({{ site.baseurl }}{% link _api/underscript/soul.md %}) as named values, with helpers that accept one of them, or the text for one, like `'gold'`, `'high'`, `'DT'` or `'BRAVERY'`.

## Syntax
> underscript.constants;

## Methods
getItem(*value*)
: Returns the matching [`underscript.constants.item`]({{ site.baseurl }}{% link _api/underscript/item.md %}), or `undefined` if there isn't one.

isItem(*value*)
: `true` if the value is an item, or the text for one.

getPriority(*value*)
: Returns the matching [`underscript.constants.priority`]({{ site.baseurl }}{% link _api/underscript/priority.md %}), or `undefined` if there isn't one.

isPriority(*value*)
: `true` if the value is a priority, or the text for one.

getRarity(*value*)
: Returns the matching [`underscript.constants.rarity`]({{ site.baseurl }}{% link _api/underscript/rarity.md %}), or `undefined` if there isn't one.

isRarity(*value*)
: `true` if the value is a rarity, or the text for one.

getSoul(*value*)
: Returns the matching [`underscript.constants.soul`]({{ site.baseurl }}{% link _api/underscript/soul.md %}), or `undefined` if there isn't one.

isSoul(*value*)
: `true` if the value is a soul, or the text for one.

## Properties
{% assign children = site.api | where: "parent", "underscript.constants" %}
{% for page in children %}
<a href="{{ page.url | relative_url }}">{{ page.title }}</a>
: {{ page.excerpt }}
{% endfor %}

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
