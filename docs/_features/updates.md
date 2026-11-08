---
title: Automatic updates
banner: updates.png
date: 2025-07-01
version: 0.63.0
---

UnderScript and plugins that support it can check for updates on their own. Plugins opt in with [plugin.updater()]({{ site.baseurl }}{% link _api/plugin/updater.md %}).

* Choose how often to check: on every page load, hourly, or daily
* Run updates silently, only being told when something was found
* Turn off updates for UnderScript, or for each plugin separately
* "Show Pending Updates" on the menu lists everything that is waiting to be installed
* An optional "GitHub token" setting, for when update checks hit GitHub's request limit

You can still check by hand with "Check for updates" on the menu.

A token with no extra permissions is enough for the "GitHub token" setting. It is only sent to api.github.com and is not included when you export your settings. If GitHub rejects it, the check goes on without it. When the request limit is what stopped an update check, a toast points you to the setting.
