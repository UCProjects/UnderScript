---
title: plugin.commands
categories: plugin
plugin: true
property: true
---
Add chat commands, the `/name` messages players type in chat. They are listed in the chat suggestions under your plugin's name. Errors thrown by your `handler` or `enabled` are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}) instead of breaking chat.

## Syntax
> plugin.commands.register(*options*);

## Methods
register(*options*)
: Add a command. Returns a handle with a `remove()` method.

### Options
command: `string`
: The name players type after the slash, required. It can only contain letters, numbers, `-` and `_`. A plugin can't register the same name twice at once.

description: `string`
: A short sentence shown next to the name in the suggestions

usage: `string`
: Shown once the name is typed, such as `<sides>`

icon: `string`
: The address of a small image shown in front of the name in the suggestions

enabled: `function`
: Return `false` to hide the command and turn it off for now. It runs every time suggestions are built, so keep it quick. If it throws, the command is turned off and the error is logged once.

handler: `function(command)`
: Called when the player sends the command. Without a handler the command is only listed, and what the player typed goes to the game as it is.

### Handler
`command` has these:

channel
: The chat window the player typed in. See [plugin.chat]({{ site.baseurl }}{% link _api/plugin/chat.md %}#channel).

command
: The name you registered, even when the player typed it with your plugin's name in front

text
: Everything the player typed after the name

output
: Assign a string to send that instead of what the player typed

Set `this.canceled = true` to send nothing. The handler needs to be a regular `function` for that, because an arrow function has no `this`. It can return a promise, and an error it throws or rejects with is logged.

### Handle
remove()
: Take the command away. Returns `true`, or `false` if it was already removed. The name can be registered again afterward.

## Owners
Every command is listed under your plugin's name, and you can't choose another. No setting is created for your commands. To let players switch one off, add a setting with [plugin.settings]({{ site.baseurl }}{% link _api/plugin/settings.md %}) and use it in `enabled`.

When two plugins register the same name, both are listed with their owners. Picking one completes to `/plugin-name:command`, with dashes instead of the spaces in your plugin's name, and typing that runs only that plugin's command. A plain `/name` goes to every handler in the order they were registered, until one cancels it.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('Dice');
const setting = plugin.settings().add({ key: 'roll', name: 'Enable /roll', type: 'boolean', default: true });

const roll = plugin.commands.register({
  command: 'roll',
  description: 'Rolls a die',
  usage: '<sides>',
  enabled: () => setting.value(),
  handler(command) {
    const sides = Number.parseInt(command.text, 10) || 6;
    command.output = `I rolled a ${Math.ceil(Math.random() * sides)}`;
  },
});

// Reply on your own instead of sending what was typed
plugin.commands.register({
  command: 'hello',
  handler(command) {
    this.canceled = true;
    command.channel.send('Hello!');
  },
});

// Later
roll.remove();
{% endhighlight %}
