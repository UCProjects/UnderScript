---
title: plugin.chat
categories: plugin
plugin: true
property: true
---
Listen to chat and send messages. Messages, notices and everything else the server sends arrive already parsed, so you don't have to unpick the game's raw frames. Errors thrown by your listeners are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}) instead of breaking other listeners.

The existing `Chat:*` [events]({{ site.baseurl }}{% link _api/events.md %}) and their raw data are unchanged.

## Syntax
> plugin.chat;

## Properties
connected: `boolean`
: Chat is connected right now

replaced: `boolean`
: Chat was taken over by another session of your account, and this one is not reconnecting on its own

channels: `Channel[]`
: The chat windows that are open right now

## Methods
on(*event*, *listener*), once(*event*, *listener*)
: Listen to a chat event. Returns `plugin.chat`.

off(*event*, *listener*)
: Stop listening

reconnect()
: Connect to chat again, if it is not connected

channel(*name*)
: Find a [channel](#channel), or `undefined` if there isn't one. `name` can be a room such as `chat-public-5`, the game's name for a public room such as `chat-roleplay` or just `roleplay`, or a public room's id such as `5`. You get the same channel object every time, so you can keep it.

send(*channel*, *text*)
: Send a message. `channel` is a channel, or anything `chat.channel` takes. Returns a [send result](#send-result) promise. It does not fire `send`. You can send to a room whether or not its window is open.

## Events
Listeners get an [event object]({{ site.baseurl }}{% link _api/eventemitter.md %}#event-object) as `this`. Set `this.canceled = true` to cancel an event. It only does something when the event is cancelable (`this.cancelable`), which is the case for `preMessage`, `send` and `command`. Use a regular `function`, because an arrow function has no `this`.

message(*message*)
: A public or private message arrived. Fires after the game has shown and stored it.

preMessage(*message*)
: A message arrived and the game has not handled it yet. Cancel it to stop it being shown or stored. `message.element` is `null` here.

history({ *channel*, *messages* })
: A chat window was filled in with its history

deleted({ *userId* })
: A moderator removed all of a user's public messages. `message.deleted` is already `true` on the messages you have from them.

notice(*notice*)
: A system line from the server: info, an announcement, or a broadcast. The info lines that refuse a message, such as the spam protection one, are reported by `rejected` instead.

rejected(*notice*)
: The server refused or failed something you tried. That includes the refusals the server words as a plain line, such as "Spam protection: You can't send any messages before 3 seconds", whose `kind` stays `info`. Not every refusal is announced, some are dropped silently.

send({ *channel*, *text*, *result* })
: The player pressed Enter in a chat window. Cancel it to send nothing, or assign `text` to change what is sent. Fires before `command`, and not for `chat.send`. `result` is a [promise](#send-result) that says what became of the message.

command({ *channel*, *command*, *text*, *output* })
: The player sent a `/command`. Cancel it to stop it, or assign `output` to send that instead.

focus(*channel*), blur(*channel*)
: The player clicked into or left a chat window's text box

connected, disconnected({ *code*, *reason* }), reconnected, replaced
: The connection changed

## Objects
### Message
id, text, emote, rainbow, timestamp
: What was sent. `emote` is a message that starts with `:me:`. `timestamp` is when it was sent, or when it arrived if the server did not say.

channel
: Where it was sent

author
: Who sent it: `id`, `name`, `avatar`, `shinyAvatar`, `division`, `mainGroup`, `groups`, `isStaff` and `isMod`. The author's own `raw` has the original data.

deleted
: Whether a moderator removed it. This stays current: it turns `true` on a message you already have when its author's messages are removed.

raw
: The original data

element
: The message in its chat window, or `null` while that window is closed

display(*text*, { *html* })
: Change what is shown for the message, as plain text unless `html` is set. The message itself is not changed. Returns `false` when it is not on screen.

restore()
: Put back what the game rendered. Returns `false` if nothing was changed.

### Channel
type, id, room
: `public` or `private`, its id, and its room such as `chat-public-1`

name
: The game's key for a public room, such as `chat-roleplay`, and `undefined` for a private chat or a public room the game has no name for

open
: Whether its window is open right now

send(*text*)
: Send a message to this channel. Returns a [send result](#send-result) promise, the same as `chat.send`.

### Notice
kind
: `info` (a gray line), `auto` (a yellow announcement), `broadcast`, `error` (a red line) or `denied` (an error dialog)

key, args
: The translation key the server sent, and the arguments that go with it

text
: What the game shows, translated into the player's language

type, userId
: For `auto`: what happened, such as `legendary-drop`, and the user it is about

### Send result
The `result` of a `send` event, and the promise `chat.send` returns, always settle and never reject. They settle with an object that has a `status`:

sent
: The message went out and came back from the server. The object also has the `message`, as the chat shows it.

rejected
: The server refused it, for example because the player is sending too fast or is muted. The object also has the `notice` the server sent, with its `key`, `args` and translated `text`.

unconfirmed
: Nothing came back within five seconds, or the connection dropped first, or the message was still waiting to go out after thirty seconds, for example while chat reconnects. The server may have dropped it without saying so, or it may still arrive. Some commands the server handles itself never come back as a message.

canceled
: A listener or the game canceled it, the game never sent it, or `chat.send` had nothing it could send.

There is no id to match a reply to a message. A message that comes back from you in the same room settles the waiting send with the same text, or the oldest waiting send in that room when none matches, since the server changes some text, such as turning emote codes into images. A refusal settles the oldest send still waiting. A message that comes back after its send was reported `unconfirmed` is recognized by its text for a minute, so it isn't taken for a later send. When two sends have the same text, or a message was dropped silently, a reply can still be matched to the wrong send.

## Examples
{% highlight javascript %}
const plugin = underscript.plugin('My great plugin');
const { chat } = plugin;

chat.on('message', (message) => {
  plugin.logger.info(`${message.author.name} in ${message.channel.name}: ${message.text}`);
});

// Hide messages from one user
chat.on('preMessage', function hide(message) {
  if (message.author.name === 'Annoying') this.canceled = true;
});

// Change what is sent
chat.on('send', (outgoing) => {
  outgoing.text = outgoing.text.replace(':shrug:', '¯\\_(ツ)_/¯');
});

// Handle your own command
chat.on('command', function roll({ command, channel }) {
  if (command !== 'roll') return;
  this.canceled = true;
  channel.send(`Rolled a ${Math.ceil(Math.random() * 6)}`);
});

chat.on('deleted', ({ userId }) => plugin.logger.info('Messages removed for', userId));

// Keep a channel to use later
const support = chat.channel('support');
support?.send('Hello!').then(({ status }) => plugin.logger.info(`Hello was ${status}`));

// Find out what happened to what the player sent
chat.on('send', ({ text, result }) => {
  result.then((outcome) => {
    if (outcome.status === 'rejected') plugin.logger.warn(`Not sent (${text}): ${outcome.notice.text}`);
  });
});
{% endhighlight %}
