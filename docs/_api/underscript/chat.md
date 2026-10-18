---
title: underscript.chat
categories: underscript
property: true
---
Read-only chat state. To listen to chat events or send messages, use [plugin.chat]({{ site.baseurl }}{% link _api/plugin/chat.md %}).

## Syntax
> underscript.chat;

## Properties
connected: `boolean`
: Chat is connected right now

replaced: `boolean`
: Chat was taken over by another session of your account

channels: `Channel[]`
: The chat windows that are open right now. See [Channel]({{ site.baseurl }}{% link _api/plugin/chat.md %}#channel).

self: `User`
: You, as a chat user. `undefined` until chat has connected. See [User]({{ site.baseurl }}{% link _api/plugin/chat.md %}#message).

friends: `User[]`
: Your friends, as chat users. Empty until chat has connected.

## Examples
{% highlight javascript %}
if (underscript.chat.connected) {
  console.log('Open chats:', underscript.chat.channels.map(({ room }) => room));
}
{% endhighlight %}
