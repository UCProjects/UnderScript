---
title: underscript.constants.priority
categories: underscript
parent: underscript.constants
---
Names for deciding what goes first, such as when ordering filters. Anywhere one is accepted you can also pass its name as text, such as `'high'`.

## Syntax
> underscript.constants.priority.*NAME*;

FIRST, HIGHEST, HIGH, NORMAL, LOW, LOWEST, LAST
: From going first to going last. `FIRST` is also known as `'top'` and `LAST` as `'bottom'`.

Every priority has `equals(other)`, and turns into its name when used as text, including in JSON. To turn text into a priority, or check if something is one, use [underscript.constants]({{ site.baseurl }}{% link _api/underscript/constants.md %}).

## Examples
{% highlight javascript %}
const { onPage } = underscript;
const { priority } = underscript.constants;
const plugin = underscript.plugin('My great plugin');

if (onPage('Decks') || onPage('Crafting')) {
  // Run this filter before the others
  plugin.addFilter((card) => card.cost > 5, priority.HIGH);

  // The name as text works too
  plugin.addFilter((card) => card.cost > 5, 'high');
}
{% endhighlight %}
