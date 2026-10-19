---
title: plugin.chat
categories: plugin
plugin: true
property: true
---
Listen to chat and send messages. Errors thrown by your listeners are caught and written to your plugin's [logger]({{ site.baseurl }}{% link _api/plugin/logger.md %}).

The existing `Chat:*` [events]({{ site.baseurl }}{% link _api/events.md %}) and their raw data are unchanged.

## Syntax
> plugin.chat;

## Methods
on(*event*, *listener*), once(*event*, *listener*)
: Listen to a chat event. Returns `plugin.chat`.

off(*event*, *listener*)
: Stop listening

reconnect()
: Connect to chat again, if it is not connected

channel(*target*)
: Find a [channel](#channel), or `undefined` if there isn't one. `target` can be a room such as `chat-public-5` or `chat-private-12` (a private chat is named for the other player's id), the game's name for a public room such as `chat-roleplay` or just `roleplay`, or a public room's id such as `5`. A [user](#user) (excluding `chat.self`) gives the private chat with them. Numbers and plain names only find public rooms. A public room has to be one the game names, or room `0`. A private chat has to be with a player chat has seen, or one that has already had a message. You get the same channel object every time.

user(*who*)
: Find a [user](#user) chat has seen, by id or by name, or `undefined`. Chat only knows users who have spoken since the page loaded and your friends. You get the same user object every time.

open(*target*)
: Open a chat window. `target` is a [channel](#channel), anything `chat.channel` takes. Returns the [channel](#channel), or `undefined` when `chat.channel` finds none for `target`, or chat is not available. A window that is already open stays as it is.

send(*target*, *text*)
: Send a message. `target` is a [channel](#channel), or anything `chat.channel` takes. Returns a [send result](#send-result) promise. It does not fire `send`. You can send to a room whether or not its window is open.

## Properties
connected: `boolean`
: Chat is connected right now

replaced: `boolean`
: Chat was taken over by another session of your account, and this one is not reconnecting on its own

channels: `Channel[]`
: The chat windows that are open right now

self: `User`
: You, as a [user](#user). `undefined` until chat has connected

friends: `User[]`
: Your friends, as [users](#user). It follows your friends list, which refreshes every few seconds, and is empty until chat has connected

## Events
Listeners get an [event object]({{ site.baseurl }}{% link _api/eventemitter.md %}#event-object) as `this`. Set `this.canceled = true` to cancel an event. It only does something when the event is cancelable (`this.cancelable`), which is the case for `preMessage`, `send` and `command`. Use a regular `function`.

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
: The server refused or failed something you tried, including refusals worded as a plain line such as "Spam protection: You can't send any messages before 3 seconds" (its `kind` stays `info`). Some refusals are dropped silently.

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
: Who sent it, as a [user](#user). It is the newest data chat has for that player, which can differ from how they looked when they sent it. `message.raw.user` is what that message arrived with.

deleted
: Whether a moderator removed it. It turns `true` on messages you already have when their author's messages are removed.

raw
: The original data

element
: The message in its chat window, or `null` while that window is closed

display(*text*, { *html* })
: Change what is shown for the message, as plain text unless `html` is set. The message itself is not changed. Returns `false` when it is not on screen.

restore()
: Put back what the game rendered. Returns `false` if nothing was changed.

### User
id, name
: The player's id and name

avatar, shinyAvatar
: Their avatar as `{ image, rarity }`, or `undefined` if it is not known, and whether it is shiny

division
: Their division, such as `GOLD_II`, or an empty string if it is not known

mainGroup, groups
: Their main group and all of their groups, as `{ id, name, priority, icon }`. A lower `priority` is a higher rank, and `icon` can be `undefined`. `mainGroup` is `undefined` for a player with no group.

isMod
: Whether their main group is a moderator or higher

isFriend, isOnline
: Whether they are on your friends list, and whether that friend is online. `isOnline` is `undefined` for anyone who is not a friend, and for you it is whether chat is connected.

gameId
: The game they are in, or `undefined`. It comes from their latest message, the games list on the home page, and for friends the friends list.

raw
: The latest data the game sent about them

toString()
: Their name, as in `${message.author}`

You get the same user object every time for the same player. It stays current: each new message from the player updates their name, avatar, division, groups and game, and your friends list updates `isFriend`, `isOnline` and `gameId` every few seconds. History messages never overwrite newer data. Chat only knows players who have spoken since the page loaded, your friends, and you (`chat.self`).

### Channel
type, id, room
: `public` or `private`, its id, and its room such as `chat-public-1`

name
: The game's key for a public room, such as `chat-roleplay` (an empty string for room `0`), the other player's name for a private chat, and `undefined` when it is not known

isOpen
: Whether its window is open right now

open()
: Open its window, the same as `chat.open`. Returns `true` when the window is open afterward, and `false` when the game cannot open it.

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

A reply is matched to a send by text. A message that comes back from you in the same room settles the waiting send with the same text, or the oldest waiting send in that room when none matches. A refusal settles the oldest send still waiting. A message that comes back within a minute of its send being reported `unconfirmed` is recognized by its text. Sends with the same text, and messages dropped silently, can be matched to the wrong send.

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
