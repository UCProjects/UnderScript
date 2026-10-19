---
title: plugin.isActive
categories: plugin
plugin: true
property: true
---
Tells you whether UnderScript wants your plugin to run. It is `true` unless the player has switched your plugin off.

Read it each time you need the answer, because it changes when the player switches your plugin on or off. Reading it once, such as `const { isActive } = plugin`, keeps the value from that moment. A version of UnderScript from before this existed has no `isActive`, so compare with `false` (`plugin.isActive !== false`) when you want to run unless you are told not to.

## Syntax
> plugin.isActive;

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My awesome plugin');

setInterval(() => {
  if (plugin.isActive === false) return;
  // Do the plugin's regular work
}, 1000);
{% endhighlight %}
