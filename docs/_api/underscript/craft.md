---
title: underscript.craft
categories: underscript
property: true
---
Settings for crafting and disenchanting. To craft cards or listen to crafting, use [plugin.craft]({{ site.baseurl }}{% link _api/plugin/craft.md %}).

## Syntax
> underscript.craft.dust;<br>
> underscript.craft.bypassProtection(*value*);

dust: `number` or `undefined`
: The dust UnderScript last saw you have, or `undefined` before it has seen any. On the Crafting page it reads the dust shown there. Elsewhere it is what the last craft, disenchant or auto left you with, which is kept for the next page in the same tab for half an hour, so it can be out of date.

bypassProtection
: On the Crafting page, UnderScript stops a craft or disenchant from starting while another one is still going, so double clicking a button doesn't do it twice. Pass `true` to turn that protection off, so your plugin can start several at once through the page's own functions, and `false` to turn it back on. It is on by default. The methods of [plugin.craft]({{ site.baseurl }}{% link _api/plugin/craft.md %}) always go one at a time and are not affected.

## Examples
{% highlight javascript %}
// Let this plugin call the page's craft function without waiting for the last craft to finish
underscript.craft.bypassProtection(true);
{% endhighlight %}
