export {};

const plain = underscript.plugin('Plain');
const versioned = underscript.plugin('Versioned', '1.0.0');
const maybe = underscript.plugin('Maybe', Math.random() > 0.5 ? '1.0.0' : undefined);

versioned.canUpdate satisfies boolean;
versioned.updater('https://example.com/plugin.user.js') satisfies () => void;
versioned.updater({ updateURL: 'https://example.com/meta.js', downloadURL: 'https://example.com/plugin.user.js' });

versioned.updater({ updateURL: 'https://example.com/meta.js' });
versioned.updater({ downloadURL: 'https://example.com/plugin.user.js' });
versioned.updater('owner/repo');

// @ts-expect-error an updater needs at least one url
versioned.updater({});

// @ts-expect-error an updater needs at least one url
versioned.updater();

// @ts-expect-error urls are strings
versioned.updater({ updateURL: 5 });

// @ts-expect-error enabled only exists in local builds, it is not part of the released api
versioned.enabled;

// @ts-expect-error unversioned plugins have no updater
plain.updater('https://example.com/plugin.user.js');

// @ts-expect-error a plugin that may or may not have a version has no updater either
maybe.updater('https://example.com/plugin.user.js');

// @ts-expect-error unversioned plugins cannot be updated
plain.canUpdate;

plain.logger.info('hello', 1, { a: 1 });
plain.logger.error(new Error('broken'));
// @ts-expect-error there is no trace level
plain.logger.trace('hello');

plain.toast('Hello');
plain.toast({
  title: 'Title',
  text: 'Text',
  className: { toast: 'dismissable', button: 'dismiss' },
  buttons: [{ text: 'OK', className: 'dismiss', onClick: () => {} }, { text: 'Stay', dismiss: false }],
  css: { 'background-color': 'red', footer: { 'text-align': 'end' } },
  error: true,
}).exists() satisfies boolean;
plain.toast({ text: 'Single button', buttons: { text: 'OK' } }).setText('Changed');
plain.toast({ title: 'Old', text: 'Titled' }).setTitle('Changed');
plain.toast({ text: 'Closes itself', timeout: 5000 }).close();
plain.toast({ text: 'Closes itself' }).close('custom reason');
plain.toast({
  text: 'Handlers',
  className: ['one', 'two'],
  css: { color: 'yellow', toast: { padding: 4 }, title: { fontSize: '16px' }, footer: { color: 'white' } },
  buttons: {
    text: 'Undo',
    className: ['dismiss'],
    css: { background: 'red', mouseOver: { background: 'darkred' } },
    onClick(event, toast) {
      event.preventDefault();
      toast.setText('Undone');
      this.close('undone');
    },
  },
  onClose(reason, toast) {
    reason satisfies string;
    toast.exists() satisfies boolean;
  },
});
plain.toast({ text: 'Styled buttons', css: { button: { color: 'white', mouseOver: { color: 'black' } } } });
// @ts-expect-error toasts without text are never shown
plain.toast({ title: 'Only a title' });
// @ts-expect-error timeouts are milliseconds
plain.toast({ text: 'Soon', timeout: '5s' });
// @ts-expect-error close reasons are strings
plain.toast({ text: 'Reason' }).close(5);
// @ts-expect-error the close reason is a string
plain.toast({ text: 'Closing', onClose: (reason: number) => {} });
// @ts-expect-error buttons need text
plain.toast({ text: 'Button', buttons: { className: 'dismiss' } });
// @ts-expect-error mouseOver belongs to buttons, not the whole toast sections
plain.toast({ text: 'Style', css: { title: { mouseOver: { color: 'red' } } } });
// @ts-expect-error toasts need text or options
plain.toast();
plain.toast({ text: 'Footer', footer: 'mine', pauseOnHover: false, role: 'alert' });

const style = plain.addStyle('.a { color: red; }', ['.b { color: blue; }']);
style.append('.c {}').replace('.d {}').remove() satisfies UnderScriptStyle;
// @ts-expect-error styles are strings
plain.addStyle(1);

plain.quests.getQuests()[0]?.progress.complete satisfies boolean | undefined;
plain.quests.update(true).then(({ quests, previous }) => {
  quests[0]?.reward.type satisfies UnderScriptItem | string | undefined;
  previous.length satisfies number;
});
// @ts-expect-error update takes a boolean
plain.quests.update('yes');

plain.addFilter?.((card, removed, results) => {
  card.name satisfies unknown;
  return removed || results.other === true;
}, underscript.constants.priority.HIGH);
plain.addFilter?.(() => null, 'low');
// @ts-expect-error unknown priority names are rejected
plain.addFilter?.(() => true, 'urgent');
// @ts-expect-error addFilter only exists on the Crafting and Decks pages
plain.addFilter(() => true);

underscript.constants.item.GOLD satisfies UnderScriptItem;
underscript.constants.priority.NORMAL.equals('normal') satisfies boolean;
underscript.constants.getItem('gold') satisfies UnderScriptItem | undefined;
underscript.constants.isPriority('first') satisfies boolean;
underscript.constants.rarity.DETERMINATION satisfies UnderScriptRarityConstant;
underscript.constants.getRarity('DT') satisfies UnderScriptRarityConstant | undefined;
underscript.constants.isRarity('TOKEN') satisfies boolean;
underscript.constants.soul.MONSTER satisfies UnderScriptSoul;
underscript.constants.soul.MONSTER.playable satisfies boolean;
underscript.constants.getSoul('KINDNESS') satisfies UnderScriptSoul | undefined;
underscript.constants.isSoul('BRAVERY') satisfies boolean;
// @ts-expect-error item constants are read-only
underscript.constants.item.GOLD = underscript.constants.item.UCP;

declare const hotkey: UnderScriptHotkey;
plain.hotkey.register(hotkey);
plain.hotkey.unregister(hotkey);
hotkey.bindKey('Escape').bindClick(2).unbindKey('Escape') satisfies UnderScriptHotkey;
hotkey.bindClick(underscript.utils.mouse.Middle);
hotkey.clicks[0] satisfies UnderScriptMouseButton | undefined;
underscript.utils.mouse.Right satisfies 2;
// @ts-expect-error that is not a mouse button
hotkey.bindClick(7);
// @ts-expect-error mouse buttons are read-only
underscript.utils.mouse.Left = 1;
// @ts-expect-error hotkey keys are strings
hotkey.bindKey(27);
// @ts-expect-error only hotkeys can be registered
plain.hotkey.register({});

plain.events.on('questProgress', (updated, previous) => {
  updated[0]?.claimable satisfies boolean | undefined;
  previous satisfies UnderScriptQuest[];
});

const { craft } = plain;
craft.craft(5) satisfies Promise<UnderScriptCraftResult>;
craft.craft('5', { shiny: true }).then(({ id, name, dust, shiny }) => {
  id satisfies number | string;
  name satisfies string;
  dust satisfies number;
  shiny satisfies boolean;
});
craft.disenchant(5, { shiny: false }) satisfies Promise<UnderScriptCraftResult>;
craft.autoDisenchant().then(({ cards, dust }) => {
  cards[0].owned satisfies number;
  cards[0].shiny satisfies boolean;
  dust satisfies number;
});
craft.on('crafted', function listener(card) {
  card.name satisfies string;
  this.event satisfies string;
}).once('rejected', ({ action, message, status }) => {
  action satisfies 'craft' | 'disenchant' | 'auto';
  message satisfies string;
  status satisfies string;
}).on('smartDisenchanted', ({ cards, dust, gained, stopped }) => {
  cards[0].quantity satisfies number;
  dust satisfies number;
  gained satisfies number;
  stopped satisfies boolean;
}).on('autoDisenchanted', ({ cards }) => cards[0].owned satisfies number)
  .on('disenchanted', (card) => card.shiny satisfies boolean)
  .off('crafted', (card: UnderScriptCraftResult) => card);
// @ts-expect-error a card id is required
craft.craft();
// @ts-expect-error shiny is a boolean
craft.craft(5, { shiny: 'yes' });
// @ts-expect-error auto takes nothing
craft.autoDisenchant(5);
// @ts-expect-error there is no such event
craft.on('crafteed', () => {});
// @ts-expect-error the listener gets the crafted card, not a string
craft.on('crafted', (card: string) => card);
// @ts-expect-error a smart disenchant run has no owned count
craft.on('smartDisenchanted', ({ cards }) => cards[0].owned);
// @ts-expect-error auto cards have no quantity
craft.on('autoDisenchanted', ({ cards }) => cards[0].quantity);
// @ts-expect-error craft is read only
craft.craft = () => Promise.reject();
craft.dust satisfies number | undefined;
// @ts-expect-error dust is read only
craft.dust = 5;

const { commands } = plain;
commands.register({ command: 'roll' }).remove() satisfies boolean;
commands.register({
  command: 'roll2',
  description: 'Rolls a die',
  usage: '<sides>',
  icon: '/images/die.png',
  enabled: () => true,
  handler(command) {
    command.command satisfies string;
    command.text satisfies string;
    command.channel.room satisfies string;
    command.output satisfies string | undefined;
    command.output = 'rolled';
    this.canceled = true;
    return Promise.resolve();
  },
}).remove() satisfies boolean;
// @ts-expect-error a command needs a name
commands.register({});
// @ts-expect-error the name is a string
commands.register({ command: 5 });
// @ts-expect-error enabled is a function
commands.register({ command: 'bad', enabled: false });
// @ts-expect-error the handler is a function
commands.register({ command: 'bad', handler: 'run' });
// @ts-expect-error a plugin cannot choose the owner
commands.register({ command: 'bad', owner: 'UnderScript' });
// @ts-expect-error no setting is made for plugin commands
commands.register({ command: 'bad', setting: true });
// @ts-expect-error the handle has nothing but remove
commands.register({ command: 'bad2' }).nope;
// @ts-expect-error commands is read only
commands.register = () => ({ remove: () => true });

const { chat } = plain;
chat.on('send', (outgoing) => {
  outgoing.channel.room satisfies string;
  outgoing.text = 'changed';
  outgoing.result.then((result) => {
    result.status satisfies 'sent' | 'rejected' | 'unconfirmed' | 'canceled';
    if (result.status === 'sent') result.message.text satisfies string;
    if (result.status === 'rejected') result.notice.key satisfies string | undefined;
  });
});
// @ts-expect-error the result is read only
chat.on('send', (outgoing) => { outgoing.result = Promise.resolve({ status: 'canceled' }); });
// @ts-expect-error only a sent message has the message that came back
chat.on('send', (outgoing) => outgoing.result.then((result) => result.message));
// @ts-expect-error there is no such status
chat.on('send', (outgoing) => outgoing.result.then((result) => result.status === 'dropped'));
chat.send('chat-public-1', 'hi') satisfies Promise<UnderScriptChatSendResult>;
chat.send('chat-public-1', 'hi').then((result) => result.status satisfies 'sent' | 'rejected' | 'unconfirmed' | 'canceled');
// @ts-expect-error send gives a result now, not a boolean
chat.send('chat-public-1', 'hi') satisfies boolean;
chat.channel('roleplay') satisfies UnderScriptChatChannel | undefined;
chat.channel(5)?.send('hi') satisfies Promise<UnderScriptChatSendResult> | undefined;
chat.on('message', (message) => message.channel.send('hi') satisfies Promise<UnderScriptChatSendResult>);
chat.on('command', (command) => command.channel.send('hi').then((result) => result.status));
chat.send(5, 'hi') satisfies Promise<UnderScriptChatSendResult>;
chat.open('roleplay') satisfies UnderScriptChatChannel | undefined;
chat.user(5) && chat.channel(chat.user(5)!) satisfies UnderScriptChatChannel | undefined;
chat.user(5) && chat.send(chat.user(5)!, 'hi') satisfies Promise<UnderScriptChatSendResult>;
chat.channel('roleplay')?.open() satisfies boolean | undefined;
chat.channel('roleplay')?.isOpen satisfies boolean | undefined;
// @ts-expect-error whether it is open is a property, opening it is a call
chat.channel('roleplay')?.open satisfies boolean | undefined;
chat.open(5)?.send('hi') satisfies Promise<UnderScriptChatSendResult> | undefined;
chat.user(5) && chat.open(chat.user(5)!) satisfies UnderScriptChatChannel | undefined;
// @ts-expect-error a target is a channel, a user, a name or a number
chat.open(true);
// @ts-expect-error opening needs a target
chat.open();
// @ts-expect-error a channel needs a name
chat.channel();
// @ts-expect-error a message is text
chat.channel(5)?.send(5);
// @ts-expect-error a name is text or a number
chat.channel(true);
// @ts-expect-error a channel is not a name, there is nothing to look up
chat.channel(chat.channel(5)!);

const { packs } = plain;
packs.buy(5) satisfies Promise<UnderScriptPacksBought>;
packs.buy(3, { type: 'DR', gold: false }).then(({ count, requested, type: kind, gold, stopped, error }) => {
  count satisfies number;
  requested satisfies number;
  kind satisfies UnderScriptBuyPackType;
  gold satisfies boolean;
  stopped satisfies boolean;
  error satisfies string | undefined;
});
packs.open(2, 'Shiny') satisfies Promise<UnderScriptPacksOpened>;
packs.open(2).then(({ cards }) => {
  cards[0].name satisfies string;
  cards[0].new satisfies boolean;
});
packs.buying satisfies boolean;
packs.opening satisfies boolean;
packs.on('bought', function listener(bought) {
  bought.count satisfies number;
  this.event satisfies string;
}).once('opened', ({ cards }) => cards.length satisfies number)
  .on('rejected', ({ action, message }) => {
    action satisfies string;
    message satisfies string;
  })
  .off('bought', (bought: UnderScriptPacksBought) => bought);
// @ts-expect-error a count is required
packs.buy();
// @ts-expect-error shiny packs cannot be bought
packs.buy(1, { type: 'Shiny' });
// @ts-expect-error gold is a boolean
packs.buy(1, { gold: 'yes' });
// @ts-expect-error there is no such event
packs.on('boughtt', () => {});
