# UnderScript Changelog


## Unreleased
### Features
1. Smart Disenchant now lists every card you can disenchant, so you can choose exactly which cards and copies to disenchant<extended>
    - Cards are grouped as Normal and Shiny, then by rarity, then by card. A group's box selects everything inside it.
    - The Prioritize Normal and Prioritize Shiny buttons select what they would have disenchanted, and you can adjust the selection before confirming.
    - Disenchanting shows its progress, can be stopped, and waits and carries on when the game rate limits the requests.</extended>
1. Added an optional "GitHub token" setting under Updates, for when update checks fail because GitHub's request limit was reached<extended>
    - A token with no permissions is enough. It is only sent to api.github.com, is not included when exporting settings, and a rejected token falls back to checking without one.
    - A toast now points to the setting when the limit is what stopped an update check.</extended>
1. In the [UnderScript App](https://discord.gg/9KPj9XcMY9), chat now stays connected: it reconnects after any unexpected disconnect, keeps retrying with a growing delay instead of giving up, and reconnects as soon as the network is back<extended>
    - If the connection keeps dropping within seconds of connecting, it waits a minute between attempts so it does not fight another client for the socket.</extended>
1. When another session of your account takes over chat, this one no longer reconnects on its own and takes it back, which made two sessions kick each other in a loop<extended>
    - A toast tells you chat was opened elsewhere and has a Reconnect button. Switching back to the tab, or sending a message, still reconnects as before.
    - Plugins can listen for it with `plugin.chat.on('replaced', ...)`.</extended>
1. Chat history now survives page loads: the last 50 public messages of each room come back after a quiet spell instead of vanishing after five minutes<extended>
    - The game drops stored history older than five minutes when a page loads, so a short break between pages emptied your chat. UnderScript now keeps its own copy and puts it back before the game reads it. There is a setting to turn it off.</extended>
1. The Friendship page now has the dimmed filter icons too, and hides the filter checkboxes when the setting for that is on Always
1. Right clicking a user in chat now opens a profile card with their avatar, level and division, and their Elo over the division icon for Master and above, above the same options as before, and a Spectate option for users who are in a game<extended>
    - Message and Mute show only for moderators, and Ignore and Mute are hidden, instead of greyed out, for yourself and for moderators.
    - Holding Ctrl while right clicking still shows the browser menu, and the Disable Chat Context setting still turns the card off.
    - The Note button keeps a note about a user on your computer. Hover it to read the note, click it to edit, and Ctrl+Enter, or clicking away, saves. Escape drops the change.
    - A new Chat setting opens the card when you click a user in chat, instead of the game's profile, which is still one option away in the card (or Ctrl+click).</extended>
1. Added a Leaderboard+ link to the Leaderboards menu in the footer
1. The Card Editor link is back in the footer, in the Community menu next to the Wiki
1. Chat command suggestions now show where each command comes from, on the right of the suggestion<extended>
    - When two scripts have a command with the same name, picking it completes to `owner:command`, and typing `/owner:command` runs only that one. The owner is the script's name, with dashes instead of spaces.
    - Typing the start of a script's name, such as `/under`, also suggests that script's commands, after the commands whose own names match.</extended>
1. The chat menu no longer blocks ignoring or muting staff who are not moderators, only moderators and yourself
### Fixes
1. Fixed the page selector being empty when there are exactly two pages, which happened on the Friendship page and any Decks or Crafting filter with two pages of cards
1. Fixed links to a player or page on the leaderboard (`?user=` and `?page=`) opening the friendship leaderboard instead of the ranked one
### Plugins
1. New `underscript.constants.soul` with the souls (`KINDNESS`, `DETERMINATION`, `PATIENCE`, `BRAVERY`, `JUSTICE`, `PERSEVERANCE`, `INTEGRITY` and `MONSTER`, which players can't play, see `soul.playable`), and `underscript.constants.getSoul` and `isSoul`
1. `underscript.item`, `priority` and `rarity` moved to `underscript.constants.item`, `priority` and `rarity`, so the named values live together instead of taking top level names. The old names still work, and log a deprecation warning the first time they are used
1. The constants (`underscript.constants.item`, `priority`, `rarity` and `soul`) now turn into their text when put in JSON, instead of an empty object
1. New `plugin.decks` for decks: `decks.current()`, `decks.storage.list(soul)`, `decks.storage.get(soul, slot)` and `decks.on('changed', ...)`<extended>
    - `decks.current()` gives the player's deck for each soul from any page, as `{ soul, cards, artifacts }`. On the Decks page it reads the page, anywhere else it asks the server.
    - `decks.storage.list()` lists the decks saved in UnderScript's deck storage as objects with `soul`, `index`, `cards`, `artifacts`, `name` and `description`. `name` and `description` can be assigned.
    - `deck.meta` keeps a plugin's own data on a saved deck: `get`, `set` and `remove` for your own keys, and `all()` and `of(plugin)` to read other plugins'. It is stored apart from the decks, so it cannot disturb scripts that read the saved decks, and it is deleted when the player erases the deck.
    - `decks.addCard`, `removeCard`, `addArtifact`, `clearArtifacts` and `clear` change the deck for a soul from any page, `decks.load(soul, { cards, artifacts })` sets it to exactly what you give it, and `decks.storage.save(soul, slot)` saves it to a deck storage slot. A saved deck has `load()`, `remove()` and `export()`, which gives a deck code like the game's with the name, description and meta added, and `export({ shiny: true })` also lists which cards are shiny. `decks.storage.import(code, { slot, meta })` saves a deck code into deck storage, into the given slot or the first empty one (which can be past the storage buttons the player sees, and logs a warning then), and restores the name, description and meta from the code. They run one at a time, reject with the server's message when it refuses, and keep the Decks page up to date.
    - `changed` fires when the player's deck changes and the server accepts it, whether it came from the Decks page or from these methods.</extended>
1. Fixed an event emitter's `cancelable`, `canceled`, `singleton` and `async` chains (the deprecated way of passing emit options) leaking into a later `emit`, when they were used but never emitted<extended>
    - Each chain now carries its own options, so `emitter.cancelable.emit(...)` behaves as before, and a lone `emitter.async` no longer changes the next emit by anyone. Pass the options to `emit` instead, as `emit({ async: true }, ...)`. Using one now logs a deprecation warning, once per option (and once per plugin for `plugin.events.emit`).</extended>
1. New `plugin.packs` to buy and open packs from any page: `packs.buy(count, { type, gold })`, `packs.open(count, type)`, `packs.on('bought' | 'opened' | 'rejected', ...)`<extended>
    - A buy or an opening always shows a toast with a Stop button while it runs, and a buy says which currency it is paying with. A `bought` or `opened` listener can cancel the event to show the result itself.
    - The server stops a run when it refuses, and a rate limit makes it wait and carry on. A pack that answers after the run gave up on it is reported on its own, with `late: true`.
    - The Packs page buys and opens many packs through it (Ctrl and Alt click to buy, Shift click to open all), so those show the same Stop toast and results. A single click still goes through the game. `underscript.buyPacks()`, `openPacks()` and `openingPacks()` are deprecated, use `plugin.packs` instead.</extended>
1. Fixed Alt-click on a buy pack button doing nothing when you could not afford all 10 packs, it now buys as many as you can afford, up to 10
1. Added `plugin.chat.open(target)` to open a chat window, or a private chat with a user. A channel has `open()` too, and `isOpen` tells you whether its window is open. `plugin.chat.channel()` and `send()` take a user, for the private chat with them
1. `plugin.events.on` now returns `plugin.events`, like `once`, `until` and `off`, so calls can be chained
1. Added `plugin.isActive`, which is `false` only when the player has switched your plugin off, so a plugin can skip its own regular work then
1. The plugin names `UnderScript` and `Undercards` are now reserved, in any letter case, so a plugin can't pass for UnderScript itself
1. New `plugin.commands.register({ command, description, usage, icon, enabled, handler })` for adding chat commands<extended>
    - Commands are listed in the chat suggestions under your plugin's name, with the icon in front. `register` returns a handle, and its `remove()` takes the command away again.
    - The handler gets `{ channel, command, text, output }`. Set `this.canceled = true` to send nothing, or assign `output` to send something else.
    - If two plugins have a command with the same name, picking one completes to `/plugin-name:command`, and typing that runs only that plugin's command.
    - Errors in your handler or `enabled` are logged under your plugin's name. No setting is made for your commands, so use `plugin.settings()` and `enabled` if players should be able to switch one off.</extended>
1. New `plugin.chat` for chat: `chat.on('message' | 'history' | 'connected' | 'disconnected' | 'reconnected' | 'replaced', ...)`, `chat.connected`, `chat.replaced`, `chat.reconnect()` and `chat.send(channel, text)`. `underscript.chat` exposes just the read-only `connected`, `replaced` and `channels`<extended>
    - Messages arrive already parsed: `message.text`, `message.author` (`name`, `avatar`, `division`, `groups`, `isMod`), `message.channel`, `emote`, `rainbow` and `deleted`, with the original data on `message.raw`. The existing `Chat:*` events and their raw data are unchanged.
    - `message.channel` has `type`, `id`, `room`, `name` (the room's key, such as `chat-roleplay`) and `open` (whether its window is open right now).
    - `message` fires for each public or private message, and `history` fires when a chat window is first filled in, with `{ channel, messages }`.
    - `notice` fires for the server's system lines (info, announcements and broadcasts) and `rejected` for the errors it sends back, and for the refusals it words as plain lines such as the spam protection one, both as `{ kind, key, args, text, raw }`, with `text` already translated.
    - `send` fires when the player presses Enter in a chat window, as `{ channel, text }`. Set `this.canceled = true` to send nothing, or assign `text` to change what is sent. It does not fire for `chat.send`.
    - A message's `author` is one live user per player: the same object every time, updated by each new message from them. `message.raw.user` keeps what that message arrived with.
    - `chat.friends` lists your friends as users. `chat.self` is your own user, known as soon as chat connects, and `chat.user(who)` finds a user by id or name. Users also carry `isFriend`, `isOnline` (friends only) and `gameId`, which follow your friends list.
    - `chat.channel(name)` finds a channel by its room (`chat-public-5`), the game's name for it (`chat-roleplay` or `roleplay`) or a public room's id (`5`), and `channel.send(text)` sends to it, so a plugin can keep a channel and use it later. You get the same channel object every time, and a message's `channel` can send too: `message.channel.send('hi')`. `chat.send` takes the same names.
    - `send` also has a `result` promise that says what became of the message: `sent` with the `message` that came back, `rejected` with the server's `notice`, `unconfirmed` when nothing came back within five seconds or the connection dropped, or `canceled`. `chat.send` returns the same kind of promise. Replies are matched by the message's text when it comes back unchanged, and by order otherwise, since the chat has no message ids to match them with.
    - `command` fires for a `/command`, as `{ channel, command, text, output }`. Set `this.canceled = true` to stop it, or assign `output` to send that instead.
    - `deleted` fires with `{ userId }` when a moderator removes all of a user's public messages.
    - `chat.channels` (also on `underscript.chat`) lists the chat windows that are open right now, and `focus` and `blur` fire with the channel when the player clicks into or leaves a chat's text box.
    - `preMessage` fires first, before the game has shown or stored the message. Set `this.canceled = true` in your listener to stop it, and check `this.canceled` to see whether something before you already did.
    - `message.display(text)` changes what is shown for a message, as plain text (or HTML with `{ html: true }`), without touching the message itself, and `message.restore()` puts the original back. A message in a chat window that is closed has no `message.element` yet, so apply it again from the `history` event.
    - An error in one of your listeners is logged under your plugin's name, with the event and its arguments.</extended>
1. New `plugin.craft` for crafting from any page: `craft.craft(id, { shiny })`, `craft.disenchant(id, { shiny })` and `craft.autoDisenchant()` return promises, and `craft.on('crafted' | 'disenchanted' | 'smartDisenchanted' | 'autoDisenchanted' | 'rejected', ...)` listens<extended>
    - The methods work on any page, one request at a time, and reject with the server's message when it refuses. On the Crafting page they also update the cards and dust shown there. They do not show the game's dialog.
    - `crafted` and `disenchanted` fire for one card as `{ id, name, dust, shiny }`, whether it came from the page's buttons or your plugin. Ctrl-click craft fires `crafted` for each copy it crafts.
    - Smart Disenchant fires a single `smartDisenchanted` when it finishes or is stopped, as `{ cards, dust, gained, stopped }`, listing every card it disenchanted and how many of each.
    - `autoDisenchanted` has the cards the server changed and how many of each you own afterwards. `rejected` has `{ action, message, status }` with the message already translated.
    - `craft.dust` (also on `underscript.craft`) is the dust UnderScript last saw you have, or `undefined` before it has seen any. It reads the Crafting page when you are on it, and otherwise the result of the last craft, disenchant or auto, which carries over to the next page in the same tab for half an hour, so it can be out of date.
    - The existing `craftcard`, `crafterrror` and `Craft:*` events are unchanged.</extended>
1. `events.emit` now (optionally) takes "emit options" as its first argument: `events.emit({ cancelable: true, async: true }, 'event', data)`<extended>
    - This works on `plugin.events` and `underscript.utils.eventEmitter()`. The options are `cancelable`, `canceled`, `singleton` and `async`.</extended>
1. `plugin.settings().add()` now throws an error when the setting's `type` isn't one that exists, instead of quietly returning `undefined`<extended>
    - The error names the setting and the type, so a typo like `type: 'slidr'` is easy to find. Its type definition no longer includes `undefined`, so you can use the returned setting without checking it first.</extended>
1. `plugin.events.off()` now returns the plugin's events object, as its type definition already said, so `events.off(...).compound(...)` works
1. `plugin.toast()` now logs a warning, once per plugin, when a button uses `onclick`. Use `onClick` instead; `onclick` still works for now
1. Added `underscript.utils.LazyStore(function)`, which holds the result of a function and only runs it the first time it is read. `reset()` makes the next read run it again
1. In the type definitions, `plugin.settings().add({ options })` is now a select, and its value is typed as the options you passed<extended>
    - `options: ['Complete', 'Partial']` gives a setting whose `value()` is `'Complete' | 'Partial'`. For `[label, value]` options it is the values, and numbers are typed as strings because that is how they are stored.
    - Passing another `type` alongside `options`, or an explicit type like `add<string>(...)`, behaves as before.
    - `transform` now receives the stored value and sets the type of `value()`, `onChange` and `on`. `default`, `converter` and `set()` use the stored value, not the transformed one.</extended>

## Version 0.65.1 (2026-10-10)
1. Fixed the Craftable cards notice on the Crafting page showing no text
1. Fixed opening packs showing several results, including an empty one, when the game was slow to answer
1. Fixed a bug where pack results could be "lost." You now get them in a separate "Late results" toast
1. For plugins: `openedPacks` events with "Late results" are marked as `late`.

## Version 0.65.0 (2026-10-09)
Gave the [UnderScript website](https://git.io/fxysg) a face-lift.
### Features
1. Added a search bar and status filters to the community plugins list, which is now sorted by name
1. The battle log can now be resized by dragging its bottom-left corner, and minimized with the button in its header
1. Staff chat commands now show up in chat autocomplete for users with permission to use them
1. Toasts can now be reached with the keyboard and dismissed with Escape
### Fixes
1. Fixed some settings pages showing an extra scrollbar when they didn't need one
1. Fixed setting notes and other hover text going off the screen
1. Fixed the sign in page not showing the settings window correctly
1. Opening packs now waits and carries on when the game rate limits the requests, instead of stopping early
1. Fixed the cosmetics shop showing two purchase confirmations, shift-click still skips the confirmation
1. Fixed the Deck Hub import arrow staying orange when you are missing a DT, it is red again
1. The Large Icon mode notice now offers to switch to small icons, since the game shows large icons already
### Plugins
1. Plugin setting pages with too many tabs to fit now split into pages, with arrows to flip between them (special thanks to Wiza for the original idea)<extended>
    - This also applies to any horizontal view made with `utils.tabManager()`. Those can pass `labels: { previous(page, total), next(page, total) }` and `tooltip: underscript.utils.hover` to `tabManager().settings()` to change the tooltip text or use UnderScript's hover instead of a plain `title`.
    - Settings pages always use UnderScript's own arrows and tooltips.</extended>
1. Added `underscript.semver.meets(<version>)` and `isBehind(<version>)` to check the UnderScript version
1. Added `plugin.settings().name(<string>)` to rename the first settings tab
1. Fixed `plugin.events.once`, `until`, and `off` not removing listeners
1. Fixed `underscript.constants.getPriority()` and `isPriority()` throwing an error
1. Added `underscript.rarity`, and `underscript.constants.getRarity()` and `isRarity()`. `underscript.utils.rarity` now accepts them, and `'DT'` for `'DETERMINATION'`
1. Fixed `underscript.user.getDecks()`, `getCollection()`, `getArtifacts()`, and `getAllArtifacts()` each making their own request when called at the same time
1. Added `underscript.d.ts` to each release, so editors like VS Code can suggest and check your plugin code<extended>
    - This is optional, plugins work the same without it.
    - Download `underscript.d.ts` from the latest release and put it next to your plugin's script.</extended>
1. Plugin `toast()` API was modified<extended>
    - `plugin.toast()`
        - A `footer` passed to `plugin.toast()` is now kept and shown in front of your plugin's name, instead of being replaced
        - `button.onclick()` was deprecated in favor of `button.onClick()`
        - `buttons` option can set `dismiss: false`, or call `event.preventDefault()` in `onClick`, to keep the toast open after the button is clicked. Buttons still close the toast by default
        - The `css` option of `plugin.toast()` is deprecated, use `className` instead. `css` still works, but a warning will show when used
    - `toast = plugin.toast()`
        - Added `toast.setFooter(text)`, which prepends text to the footer
        - Added `toast.setTitle(title)`, which allows you to modify toast title
        - Added `toast.element`, so you can modify the element directly</extended>

## Version 0.64.0 (2026-09-28)
### Features
1. Added "crafting" option for "merge shiny cards" setting
1. Added a search bar to the settings screen
1. Added descriptions to settings
1. Added autocomplete for emotes and chat commands
1. Added a community plugin registry to the menu, so you can browse and install plugins
### Fixes
1. You can now surrender in story mode
1. Fixed "Enable ping toasts" showing twice
1. Fixed the "Background Priority" setting not loading
1. Fixed various rank issues
### Plugins
1. Fixed "list" setting type
1. You can now register multiple setting "pages"<extended>
  - `plugin.settings().page('name').add(setting);`
</extended>

## Version 0.63.19 (2026-08-08)
1. Fixed UnderScript not loading for some pages
1. Added new Vanilla Settings (volume)

## Version 0.63.18 (2026-07-31)
1. Fixed some bugs that crashed UnderScript
1. Fixed UnderScript stalling games
1. Fixed styles related to game chat
1. Removed audio settings
1. Disabling Large Avatar mode will now make avatars small
1. Fixed battle log not sizing correctly

## Version 0.63.15 (2026-01-06)
1. Fixed the changelog

## Version 0.63.14 (2026-01-06)
Apparently UnderScript updates were broken and the past few releases didn't go through. Here's the changes:
1. Fixed filters not resetting to first page
1. Fixed battle log not translating story username
1. Fixed chat ping highlight conflicting with base game
1. Fixed mac support for "control" key (use meta instead)

## Version 0.63.11 (2026-01-03)
1. Fixed chat ping highlight conflicting with base game
1. Fixed mac support for "control" key (use meta instead)

## Version 0.63.10 (2026-01-01)
1. Fixed filters not resetting to first page
1. Fixed battle log not translating story username

## Version 0.63.9 (2025-09-10)
1. Fixed in-game audio

## Version 0.63.8 (2025-09-03)
1. Fix battle log (for realsies)

## Version 0.63.7 (2025-09-02)
1. Fix battle log

## Version 0.63.6 (2025-08-15)
1. Minor bug fixes

## Version 0.63.5 (2025-08-01)
1. Added `underscript.item`
1. Added `underscript.priority`
1. Added priority to `plugin.addFilter()`
1. Removed extra spacing in deck storage
1. Fixed "Grand Prize" in battle log
1. Fixed searching for "Grand Prize" in collection

## Version 0.63.4 (2025-07-11)
1. Improved Deck/Crafting filters
1. Added `results` to `addFilter` callback
1. Restored old rarity behavior on Crafting page

## Version 0.63.3 (2025-07-06)
1. Added Shiny filter on Decks page back

## Version 0.63.2 (2025-07-06)
1. Fixed a translation error with friendship rewards
1. Fixed end turn hotkey toast not showing correct setting

## Version 0.63.1 (2025-07-02)
1. Reverted "reversed settings"
  - They were completely broken

## Version 0.63.0 (2025-07-01)
Over 5000 line changes~ (in 250 files)
### Features
1. Added custom translation files for UnderScript text
  - Work in progress, there's a lot of text in UnderScript...
1. Added ability to `transform` setting values
1. Added new "update" utility
  - Used with UnderScript (and plugin) updates
1. Added setting to change auto update frequency
1. Added setting to run auto updates silently
  - Only shows a notification if updates are found
1. Added setting to `Disable Plugin Updates`
  - You can disable updates for each plugin as well
    - Plugins must opt-in to use the updater before you can see this setting
1. Added `Pending Updates` window
1. Added more vanilla settings
1. Reversed some settings that were "enabled" when checked rather than "disabled" when checked.
### Fixes
1. Fixed list setting defaults not using the correct values
1. Fixed issues with "matching" advanced map keys
1. DT's are now craftable
1. Fixed `events.one` not passing event metadata
1. Fixed issue with `async` events not being async
1. Fixed battle log card names not using the correct name
1. Fixed quick craft not using correct name
1. Fixed error where Daily Rewards could say you have one less day
1. Fixed some bugs with `AdvancedMap` settings
### Plugins
1. Pack Items are now valid when using `openPacks`
1. `underscript:ready` event
  - Called when UnderScript assets are loaded
1. Added plugin update checker<extended>
  - When creating plugins use `underscript.plugin(name, version)`
    - You ***must*** pass version to get access to `updater`
  - Basic: `plugin.updater(downloadUrl)`
    - Supports `github.com`, `gist.github.com`
  - Github Release: `plugin.updater({ updateURL: '@USER/REPO' })`
</extended>
1. Fixed events not returning the proper value
1. Improved `addStyle()` code
  - Added error when style is malformed
1. You can now pass defaults to `AdvancedMap`s

## Version 0.62.5 (2025-05-20)
1. Fixed (another) bug with advanced map
1. Fixed bug with chat

## Version 0.62.4 (2025-04-14)
1. Fixed bug with advanced map

## Version 0.62.3 (2025-04-09)
1. Fixed bugs with game sounds (including April fools)

## Version 0.62.2 (2025-04-09)
1. Fixed April Fools setting being too aggressive
1. Fixed April Fools messing up persistent background

## Version 0.62.1 (2025-04-04)
1. Fixed plugins breaking when providing custom settings

## Version 0.62.0 (2025-04-03)
### Fixes
1. April fools setting is no longer so greedy
1. April fools setting properly applies when home page refreshes
1. Minor bug fixes related to settings
### Plugins
1. Added `keybind` setting type
1. Added `advancedMap` setting type
  <extended>
  1. `type: { key?: SettingType, value?: SettingType },`
  </extended>
1. Added `underscript.utils.translateText()`<extended>
```ts
  translateText(text: string, {
    args: string[],
    fallback?: string,
    locale?: string, // translate as a specific language
  });
```
</extended>

## Version 0.61.0 (2025-04-01)
Surprise! April fools update.
### Fixes
1. Manual updates now fix broken update announcements
1. Updated April fools settings to work for this year
### Plugins
1. Added support for plugins to provide their version
1. Added `Settings:open` event
1. Added `plugin.events.compound(...events, callback)`
1. Added `plugin.version`
1. Added `disabled` to setting creation

## Version 0.60.4 (2025-03-18)
1. Fixed notification sound turning off permanently

## Version 0.60.3 (2025-03-17)
1. Due to popular demand, you are now prompted to keep `@underscript`
1. Fixes some bugs with toasts

## Version 0.60.2 (2025-03-16)
1. Fixed quest progress notification (probably)

## Version 0.60.1 (2025-03-15)
The great plugin (& bug fix) update
### Fixes
1. Deck Storage now translates card names
1. The CSS for settings no longer do silly things
1. Setting "reset" now allows a default value of 0
1. Settings now always properly encode before saving
1. Stopped an error from happening when logged out
1. Broken settings no longer completely break the setting window
### Plugins
1. You can now edit settings while the setting window is open
1. Added `map` setting type
1. Allow event listeners to be turned off
1. Renamed event `:loaded` to `:preload`
1. Added `name` to setting creation

## Version 0.60.0 (2025-03-15)
- See v0.60.1

## Version 0.59.0 (2025-01-31)
New release for a new year. Enjoy~
### Fixes
1. Find pack prices smartly
1. Fixed some debug messages
### Plugins
1. Added `Home:Refresh` event
1. Added new `Item` keywords

## Version 0.58.3 (2024-06-19)
1. Fixed friendship shiny packs

## Version 0.58.2 (2024-05-29)
1. Fixed broken pack buying API
1. Added more cases where chat will reconnect

## Version 0.58.1 (2024-05-24)
1. Re-enabled smart disenchant
  - This is still at your own risk, and you must manually enable it in settings.

## Version 0.58.0 (2024-04-27)
### New Features
1. Automatically attempt to reconnect to chat
1. Ignore self legend messages
### Plugin
1. Added [script](https://raw.githubusercontent.com/UCProjects/UnderScript/master/src/checkerV2.js) to validate underscript for plugins to utilize in their code
  - This is easier to use than the [old one](https://raw.githubusercontent.com/UCProjects/UnderScript/master/src/checker.js)

## Version 0.57.2 (2024-04-10)
1. Fixed display bug with cosmetic confirmation purchases
1. Fixed bug loading all cards
1. Fixed bug loading plugin styles

## Version 0.57.1 (2024-04-06)
1. Made filtered buttons dimmer
1. Made Shiny filtered button bigger
1. Fixed collection dropdown filter translation error

## Version 0.57.0 (2024-04-01)
### New Features
1. Added filter for tribes
1. Added filters for crafting collection
1. Cleaned the filter buttons so it looks less cluttered
### Misc.
1. Adjust music volume while in settings
### Plugin
1. Added method for plugins to add own collection filters `plugin.addFilter()`

## Version 0.56.3 (2024-03-31)
1. Removed broken googletagmanager
1. Fixed broken sound code
1. Fixed broken backgrounds

## Version 0.56.1 (2024-01-21)
1. Add support for older browsers

## Version 0.56.0 (2023-10-22)
### Plugins
1. Added a few more Constants
1. Added `plugin.settings().value(key)` lookup

## Version 0.55.6 (2023-10-19)
1. Breaking quest stuff, CMD_God will need to update :sad:

## Version 0.55.5 (2023-10-17)
1. More quest stuff (Thank CMD_God)

## Version 0.55.4 (2023-10-17)
1. Fix quest reward bug

## Version 0.55.3 (2023-10-16)
1. Fixed another quest bug

## Version 0.55.1 (2023-10-16)
1. Fixed quest detection

## Version 0.55.0 (2023-10-15)
### New Features
1. Implement Bug Tracker (Sentry.io)
1. Quest Progress Toast
### Misc.
1. Update google analytics
### Plugins
1. `player:endTurn` event (cancelable)
1. `plugin.quests.update()`: Updates quests, returns `Promise.then({ quests, previous }).catch(error)`
1. `plugin.quests.getQuests()`: Gets currently cached quests (empty if update is not called)

## Version 0.54.1 (2023-08-19)
1. (Really) Fixed `Collect All` friendship button
1. Re-enable play queue after 10 seconds

## Version 0.54.0 (2023-07-08)
### New Features
1. Import deck via URL
### Fixes
1. Fixed `Collect All` frienship button
### Misc.
1. Removed `Disable Quick Opening Packs` setting

## Version 0.53.1 (2023-07-02)
1. Fixed changelog
1. Fixed friendship ranking not loading sometimes

## Version 0.53.0 (2023-05-23)
### New Features
1. Added craft/disenchant protection to prevent double clicking
1. Added new ranks to board background priority
### Fixes
1. Fix background of `@autocomplete`

## Version 0.52.1 (2023-04-05)
1. Fixed issue breaking sound in games

## Version 0.52.0 (2023-04-03)
### New Features
1. Added setting to disable `Audio Override` (disables undercards Audio fixes)
1. Added setting to disable `April Fools Music` (if you get tired of it)
### Fixes
1. Fixed april fools music not working with underscript
1. Fixed translations thinking they weren't loaded when they were
### Misc.
1. BootstrapDialog `onhide()` return value is no longer ignored
### Plugins
1. EventEmitter is now extendable
1. Throw errors when failing to register settings
1. `appendCard()` is deprecated
1. Settings now have more dynamic values
1. Added [`checkUnderscript(pluginName)`](https://raw.githubusercontent.com/UCProjects/UnderScript/master/src/checker.js) for plugins to utilize in their code
1. `appendCard` events are now all called correctly

## Version 0.51.3 (2022-12-13)
1. Fix appendCard data

## Version 0.51.2 (2022-10-30)
1. Actually fix issue in all cases

## Version 0.51.1 (2022-10-30)
1. Fix issue where PrettyCards would break descriptions

## Version 0.51.0 (2022-10-29)
### New Features
1. Added events for ALL `appendCard` functions
1. Added `crafterror` event
1. Added user deck functions `user.getDecks`, `user.getCollection`, `user.getArtifacts`
1. Added `user.getUCP` function
1. Cards get marked as `new` if you don't currently have them in your collection
1. Translate various setting names/values
1. Added `user.getCardSkins`
### Fixes
1. Fixed plugin modules not loading properly when they depend on another module
1. Fixed `craftcard` event
1. Fixed some content toasts
1. Fixed delayed singleton data emittion
### Misc.
1. `emitter.one` alias for `emitter.once`
### Plugins
1. Added `plugin.settings.open`
1. Added plugin hotkey registration

## Version 0.50.6 (2022-06-22)
1. Fixed error with script loading
1. Fix `undefined dust`
1. Spectate*
1. Fix persist bgm breaking skin themes
1. Allow music played by underscript to be cancelable
1. Fixed minigame playing when disabled
1. Possibly fixed friends list errors
1. `:loaded` event can't be delayed
1. Fixed a few issues with settings display

## Version 0.50.4 (2022-04-06)
1. Fixed "ignore user" setting
1. Fixed "trust link" setting
1. Fixed "auto decline" setting
1. Changed icon for dragging list items
1. Added notification (with setting) when background is overridden
1. Fixed dust pile counter
1. Fixed note for buying packs

## Version 0.50.3 (2022-03-29)
1. Fixed UnderScript being too fast for its own good

## Version 0.50.2 (2022-03-29)
1. Fixed settings not showing sometimes
1. Fixed setting notes not showing
1. Added another alternate update link

## Version 0.50.1 (2022-03-28)
1. Fixed boolean setting errors
1. Fixed board background setting not applying your background
  1. NOTE: If you changed this setting, Legend is now at the bottom of your list due to a bug.

## Version 0.50.0 (2022-03-28)
### New Features
1. Colorized cards in deck storage
1. Added setting to show your preferred board background (Settings -> Game)
### Fixes
1. Fixed error toasts (red) ignoring their close events
1. Fixed storage not coloring correctly sometimes
1. Fixed player damage/healing not showing
1. Fixed a bug when hiding minigames
1. Fixed bug when chat is not loaded
### Misc
1. Pack opener tries a bit harder to open all packs
1. Check pending friend requests quicker
1. Settings code is much cleaner
### Plugins
1. Added `plugin.settings().addType(new YourSettingType())`
1. Added `underscript.utils.compoundEvent(...events, callback)`
1. Added `allCardsReady` event

## Version 0.49.4 (2022-03-07)
1. Fixed some pack opening bugs
1. Fix import showing missing cards when you have a shiny to replace it
1. Fix /scroll bug
1. Fix multiple update notifications

## Version 0.49.3 (2022-03-06)
1. Fixed craft border highlighting when not enough dust
1. Fixed max crafting without enough dust
1. Fixed CSS not loading at correct time
1. Fixed "trusted link" not opening the link
1. Fixed a small bug with chat

## Version 0.49.2 (2022-03-02)
1. Fixed hub showing missing cards when you have the full deck
1. Fixed in-game emotes not being disabled (again)
1. Fixed "gaining -HP"
1. Fixed loading deck after switching souls

## Version 0.49.1 (2022-02-26)
### New Features
1. Mark hub decks missing DT(s)
1. Mark missed quest days
1. Large Icon mode
1. Trusted domains (like in discord)
### Fixes
1. Fixed chat events not registering sometimes
1. Fixed dismissable toasts appearing when dismissed.
1. Fixed bug with spectating events
1. Fixed persistent arena background
1. Fixed in-game emotes not being disabled
1. Fixed some spectate events not working
1. Fixed a bug when spectating as a guest
1. Fixed hub display issues
### Misc
1. Battle log now shows artifact details
### Plugins
1. Added `pre:appendCard()` event

## Version 0.48.0 (2022-01-23)
### New Features
1. Added settings to disable/hide individual emotes you own
1. Added a few new events
  <extended>
  1. :loaded:PAGE
  1. :load:PAGE
  1. :unload:PAGE
  </extended>
1. Added `async` and `delayed` to event meta
1. Added `canceled` to event emitter<extended>: sets initial canceled state to true</extended>
### Fixes
1. Fixed singletons being callable twice
1. Improved pack opening algorithm
1. Fixed a few issues with event emitter

## Version 0.47.1 (2021-12-16)
### New Features
1. New display for underscript settings
1. Added audio settings
1. Game errors now show a notification instead of a window
### Plugins
1. Expose more `events` functions
1. Fix `user.ignore()`
1. Added `setting.show()` to open the settings window
1. Removed deprecated `underscript.addStyle()`

## Version 0.46.4 (2021-10-31)
1. Fixed streamer mode chat
1. Sandboxed `underscript.addStyle`
1. Fixed randomly broken setting

## Version 0.46.3 (2021-10-31)
1. Skipped on accident

## Version 0.46.2 (2021-08-16)
1. Fixed minimizing chat
1. Added "alt" update button on update toast

## Version 0.46.1 (2021-08-12)
1. Fixed script not working

## Version 0.46.0 (2021-08-12)
### New Features
1. Added modes to "Random fill deck" button
1. Added "new card" toast
### Fixes
1. Fixed deck storage loading
1. Fixed chat not showing up with certain settings
### Plugins
1. Expose `underscript.utils`
1. Expose `underscript.lib`
1. BootstrapDialog events `BootstrapDialog:create|show|shown|hide|hidden`

## Version 0.45.1 (2021-06-16)
1. Fixed import bug (what does testing mean?)\

## Version 0.45.0 (2021-06-16)
### New Features
1. Added ability to buy multiple packs
1. Added confirmation for buying packs with UCP
1. Added a setting to switch minigame controls to WASD (disabled by default)
1. Added a random avatar button
1. Added setting to prefer shiny on import (enabled by default)
1. Added "fill deck" button
1. Added confirmation for buying cosmetics
### Fixes
1. Fixed bug with base card skin setting
### Plugins
1. Added API to buy multiple packs
### Misc.
1. Added a 5th slot to the storage rows

## Version 0.44.0 (2021-05-30)
### New Features
1. Now handles Quest Pass announcements
1. Added "outline card text" setting
1. Added "outline card tribe" setting
1. Added setting to disable *all* card skins
1. Added toast when kicking non-friends out of custom games
### Fixes
1. Fixed translation preview
1. Fixed crafting more than max (with CTRL)
### Misc.
1. Removed "smart disenchant"

## Version 0.43.3 (2020-12-31)
1. Completely disabled smart disenchant, until it's remade.

## Version 0.43.3 (2020-12-30)
1. Fixed issue where background tasks didn't run correctly
  * This includes: Accepting friends, Deleting Friends, Refreshing the main page, Quest notifications...

## Version 0.43.2 (2020-12-24)
Merry Christmas!
1. Fixed friendship bug
1. Fixed not being able to copy battle log text
1. Fixed a bug I missed in the last update
1. Changed how UnderScript loads 3rd party code

## Version 0.43.1 (2020-12-24)
This update is broken!

## Version 0.43.0 (2020-12-05)
### New Features
1. Added button to show your friend rankings on the leaderboard
1. Added setting to disable friend request notifications
1. Added option to show "breaking" art as "full" art
### Fixes
1. Fix page selection on leaderboard
1. Loading user links on leaderboard now load correctly
1. Fix deleting friends without reloading page
1. Error when loading deck correctly exits
### Plugins
1. Added "eventManager.once(event, function)"<extended> - Listens to event once</extended>
1. Added "eventManager.until(event, function)"<extended> - Listens to event until returns truthy</extended>

## Version 0.42.0 (2020-11-01)
### New Features
1. Added setting to ignore pings from closed chats
1. Opponent now shows on autocomplete
1. Added external projects to Undercards Menu
1. Added option to only show online friends in autocomplete
### Fixes
1. Fixed user turn not showing in battle log
1. Fixed streamer mode chat errors
1. Fixed online friends not updating (thanks Onu)

## Version 0.41.2 (2020-10-15)
1. Fixed Token not working in Craft page (again)

## Version 0.41.1 (2020-10-15)
1. Fixed "Token" not working in Crafting page.
1. History pings no longer make sound
1. Ping toasts now use correct channel name

## Version 0.41.0 (2020-10-12)
### New Features
1. Reload Cards menu item
### Fixes
1. Load storage more reliably
1. Don't show "turn start" twice
1. Load card name from storage
### Misc.
1. Changed @everyone to @underscript
1. Updated for next patch

## Version 0.40.0 (2020-08-31)
### New Features
1. First/Last page shortcut now works on every valid webpage
1. Page selection now works on every valid webpage
1. Split Generated and Base rarities on the crafting screen.
1. Merge shiny and non-shiny in collection (default: Deck only)
  1. Settings -> Library -> Merge Shiny Cards
Note: When these filter settings are applied, the rarity icons are semi-transparent (making them look darker)


## Version 0.39.2
1. Fixed battle log being inconsistent on game finish for players/spectators
1. Fixed some internal bugs
1. Fixed queue disabled message

## Version 0.39.1
1. Fixed broken avatars

## Version 0.39.0
### New Features
1. Minigames no longer take over your arrow keys while playing them
1. Friendship now displays rankings for each of your cards
### Fixes
1. Added setting to disable "collect all friendship"
1. Autocomplete no longer selects trailing text
1. Better translation preview support
### Plugins
1. Fixed some bugs
1. Deprecated "cancelable" events

## Version 0.38.1
1. Fixed bug that made deck storage load only one card at a time
1. Fixed bug where deleted artifacts caused deck loading to repeat endlessly

## Version 0.38.0
### New Features
1. Display a toast about space/middle click turn skip hotkey
1. Added a friendship reward toast
1. Added a progress bar when opening multiple packs (and a stop button)
1. Added a button to collect all available Friendship rewards
### Fixes
1. You can now open all packs again
1. Fixed patch notes not showing on mid-season patch
1. Fixed a bug with loading new reinforcement artifact from deck storage
1. Fixed a bug with Bundle toasts not working
1. Fixed bug where it thinks you're on the play page while in a game
### Misc
1. Removed duplicate "disable skin toasts" setting

## Version 0.37.0
### New Features
1. Added setting to disable game list refresh
### Fixes
1. Fixed completed daily quests looking bad
### Stop-gap
1. Quick opening packs can now only open 10 at a time, due to Onucode.

## Version 0.36.2
1. Fixed background song playing twice
1. Fixed duplicate names in autocomplete

## Version 0.36.1
1. Fixed various bugs

## Version 0.36.0
### New Features
1. Visual Autocomplete
1. List completed quests
1. Call an event when translations get loaded
1. Disable breaking card art setting
### Fixes
1. CTRL+SHIFT when opening packs will only open one pack (with toast)
1. Fixed not having any ping phrases causing everything to ping you
1. Fixed battle log setting not applying while playing game
1. Fixed ignoring stacking messages in a single window
1. Fixed 'none' ignore type not being an option
1. Fix the header mixing with card tribes and such
1. Footer can no longer cover any part of the page
1. Vanilla settings that shouldn't show no longer show
1. Fixed bugs that cropped up when the spectate URL changed
### Misc
1. Removed some old features that don't do anything anymore

## Version 0.35.0
### New Features
1. Disable full card art setting
1. Added Volume Slider for Game Found sound
1. More Api
  <extended>
    1. ready: boolean
    1. addStyle(...style: string): void
    1. plugin(name: string): RegisteredPlugin
      1. plugin.toast(data): toast
      1. plugin.logger
      1. plugin.events
      1. plugin.settings()
    1. appendCard() event
  </extended>
### Fixes
1. Gold average works again
1. `@` now works in custom ping values
1. Tip styling arrow (online friends list)
1. Fixed `/scroll` giving an error
### Misc
1. Removed `smooth scrolling deck` feature (it causes bugs, don't need it anymore)
1. Added note for streamer mode
1. More stability for opening large amounts of packs

## Version 0.34.1
1. Fixed battle log not showing card events

## Version 0.34.0
1. Fixed /spectate command
1. Fixed deck page squishing buttons
1. Fixed updater not working
1. Fixed battle log size issues
1. Changed the position of the game timer
1. Added some more API functions
  <extended>
    1. streamerMode(): boolean
    1. onPage(page): boolean
  </extended>

## Version 0.33.1
1. Fixed revealing packs
1. Fixed crafting max cards
1. Fixed highlighting craftable cards

## Version 0.33.0
Happy new year!
### New Features
1. You can now change the color of friends
1. Error toast when the queue mess up (you get disconnected)
1. Added a few simple APIs
  <extended>
    `underscript.`
    1. openPacks
    1. eventManager
  </extended>
### Improvements
1. Improved pack opening (less likely to crash with over 2000 packs)
### Fixes
1. Fixed server-restart not being detected
1. Fixed removing cosmetics highlight in the menu
1. Fixed opponent tag setting not working

## Version 0.32.8
1. Updated for next season (again)

## Version 0.32.7
1. Updated for next season

## Version 0.32.6
1. Fixed battle log when spectating

## Version 0.32.5
1. Fix battle log soul color
1. Fixed miscellaneous errors

## Version 0.32.4
1. Fixed deck storage
1. Fixed various other issues on Decks page

## Version 0.32.3
I messed up the last changelog, so you get the old change log this time as well.
1. Fixed battle log error for next season
1. Fixed spam crafting with CTRL+Click
1. Fixed more bugs

## Version 0.32.2
1. Fixed battle log error for next season
1. Fixed spam crafting with CTRL+Click

## Version 0.32.1
1. Prep for next season
2. Fix menu getting covered by other stuff sometimes

## Version 0.32.0
### New Features
1. Make undercards tips pretty (by using our theme)
### Fixes
1. Fix emotes not getting toasted
1. Support animated avatars

## Version 0.31.1
1. Fixed tippy being an old version

## Version 0.31.0
### New Features
1. You can now disable in-game battle log
1. Added setting to disable header scrolling
### Fixes
1. In-game battle log no longer covers your avatar (Sorry 'bout that)
1. Possible fix for header scrolling leaving a bunch of lines on some computers (otherwise you can disable it now)

## Version 0.30.0
### New Features
1. Translations now have a preview
2. The header bar now scrolls with the page
### Fixes
1. Fixed card name in english setting (maybe)
2. Fixed quest name showing up when quests completed (hopefully)

## Version 0.29.0
### New Features
1. Added an Icon helper (Packs and such)
### Fixes
1. Pack count now decreases when opening all packs
1. You should no longer get as many invalid friend requests
### Misc.
1. Dust counter is now disabled by default

## Version 0.28.1
### Fixes
1. The deck hub no longer thinks you're always missing artifacts

## Version 0.28.0
### New Features
1. Added link to card editor under "Links"
1. You can now completely hide ignored messages
### Fixes
1. Skins toast properly again
### Misc.
1. You can now ignore balancers
1. You can access UnderScript's menu from UnderCards' menu
1. Updated code for next season

## Version 0.27.2
1. New color for <span class="friend">friends</span> in chat
1. Fix game patches not turning into toasts
1. Fix chat toast room name

## Version 0.27.1
1. Fixed card skin shop names looking small
1. Fixed local reset time
1. Fixed surrender/disconnect message in battle log

## Version 0.27.0
### New Features
1. Return of the "game found" notification

### Fixes
1. Winstreak toast displays properly (for real this time)

## Version 0.26.3
1. Fix quest notification
1. Fix home page translations
1. Fix legend user notification
1. Fix legendary card draw notification
1. Fix winstreak notification

## Version 0.26.2
1. Fix battle log (again)

## Version 0.26.1
1. Fix battle log and dust count

## Version 0.26.0
### New Features
1. Craft max with a hotkey (CTRL + Click)
1. Translation support
  1. Drop down menu to select specific pages
  1. Attempt to translate things UnderScript loads if possible
  1. Added setting to force card names to appear in English (no matter your language)

### Fixes
1. Fix card skin store not displaying cards correctly

## Version 0.25.2
1. Fixed /gg command

## Version 0.25.1
1. Fixed chat breaking

## Version 0.25.0
### New Features
1. Added settings to auto decline specific friend requests
1. Added toggle to lock custom games to friends
1. Automatically update the online friends list
1. Click on hovered cards (that shouldn't be there) to remove them
1. Chat will now scroll to the bottom more often
1. You can now disable minigames in the lobby
1. Chat commands~
  1. /scroll to scroll to the bottom of the chat
  1. /gg to send `@o good game`
  1. /spectate to send the spectate url
1. You can now turn off emotes in chat (will turn into text)
1. Added settings for disabling in-game emotes
1. Streamer mode
1. Leaderboard gets a touch of magic
  * Added a drop down menu for selecting specific pages
  * Added URLs to go directly to a page/user
  * Feedback when a user is not found

### Fixes
1. Fixed bug where the spectate list refreshes too quickly
1. Fixed shiny base cards showing as craftable when you can't afford it
1. Cards now have their correct description on the history log
1. Disabling scrolling on collection now works

## Version 0.24.2
1. Fixed chat breaking

## Version 0.24.1
1. Fixed @username not pinging you

## Version 0.24.0
### New Features
1. Added setting to stop April Fools Day

### Fixes
1. Updated chat to account for @
1. Fixed surrender button

## Version 0.23.6
1. Prepped for next season

## Version 0.23.1
1. Fixed updates going to the wrong URL

## Version 0.23.0
### New Features
1. Deck Storage now saves and loads artifacts
  * Note: You need to resave your decks to add artifacts to them
1. Added changelog
1. Added options for winstreak announcements
1. Added options for legend rank announcement
1. Jump to First/Last collection page
  * Control Click
1. Added option to disable changing collection page with scrollwheel
1. Added option to disable screen shaking
1. Added confirmation for ignoring users
1. @O now tags opponent
1. Can now decline all friend requests at once

### Fixes
1. Fixed the spectator list not resizing sometimes

## Version 0.22.9 (3/19/19)
1. Actually fix smart disenchanting

## Version 0.22.8 (3/17/19)
1. Smart Disenchant now works

## Version 0.22.7 (3/15/19)
1. Script now loads properly on crafting/deck page

## Version 0.22.6 (3/15/19)
1. Fix crafting features

## Version 0.22.5 (3/14/19)
1. Fix most of the deck features to work with 32.1
