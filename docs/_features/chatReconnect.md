---
title: Chat reconnect
date: 2024-04-27
version: 0.58.0
---

If the connection to chat drops, UnderScript tries to reconnect on its own. In the browser it makes a few tries, waiting a little longer after each one, and only while the tab is the one you are looking at.

In the [UnderScript App](https://discord.gg/9KPj9XcMY9) chat stays connected. It never gives up, waits a little longer between tries up to half a minute, and reconnects as soon as the network is back. If the connection keeps dropping within seconds of connecting, it waits a minute between tries so it does not fight another client for the connection.

When another session of your account takes over chat, this one does not reconnect on its own and take it back, which made two sessions kick each other in a loop. A toast tells you chat was opened elsewhere and has a Reconnect button. Switching back to the tab, or sending a message, reconnects as before. Plugins can listen for it with [plugin.chat]({{ site.baseurl }}{% link _api/plugin/chat.md %}).
