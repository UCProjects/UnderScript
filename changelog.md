# UnderScript Changelog

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
