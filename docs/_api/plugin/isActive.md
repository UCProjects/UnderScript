---
title: plugin.isActive
categories: plugin
plugin: true
property: true
---
Tells you whether UnderScript wants your plugin to run. It is `true` unless the player has switched your plugin off through the setting.

Read it each time you need the answer. Reading it once, such as `const { isActive } = plugin`, keeps the value from that moment. Compare with `false` (`plugin.isActive !== false`) to see if your plugin should run.

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
