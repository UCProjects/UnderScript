import Translation from 'src/structures/constants/translation';
import { blankToast, dismissable, errorToast, infoToast, toast } from 'src/utils/2.toasts';
import * as cardHelper from 'src/utils/cardHelper';
import * as hover from 'src/utils/hover';
import * as menu from 'src/utils/menu';
import Plugin, { getPluginNames, getVersion, registerModule } from 'src/utils/plugin';
import * as chatCommands from 'src/utils/chatCommands';
import * as loadDeck from 'src/utils/loadDeck';
import notify from 'src/utils/notifications';
import * as quests from 'src/utils/quests';
import TabManager from 'src/utils/tabbedView';

toast('text') satisfies UnderScriptToast | false;
toast({ text: 'text', title: 'title', timeout: 5 }) satisfies UnderScriptToast | false;
toast(Translation.CLOSE) satisfies UnderScriptToast | false;
toast({
  text: Translation.CLOSE,
  buttons: [{ text: 'ok', onClick() {} }, { text: Translation.CLOSE, dismiss: false }],
});
// @ts-expect-error a toast option that does not exist
toast({ text: 'text', nope: true });
// @ts-expect-error timeout is a number
toast({ text: 'text', timeout: 'soon' });
// @ts-expect-error a number is not toast text
toast(5);

blankToast() satisfies UnderScriptToast;
errorToast(new Error('bad')) satisfies UnderScriptToast | false;
infoToast('Fyi', 'key', '1') satisfies UnderScriptToast | false | null;
infoToast({ text: 'Fyi', onClose() { return true; } }, 'key');
dismissable({ title: 'Title', text: 'Text', key: 'key' }) satisfies UnderScriptToast | false | undefined;
// @ts-expect-error dismissable needs a key
dismissable({ text: 'Text' });

hover.show('<b>tip</b>', '1px solid white')({ type: 'mouseenter' });
hover.show(Translation.CLOSE);
hover.hide() satisfies void;
hover.tip('text', '.target', { placement: 'top-start', fade: true });
// @ts-expect-error not a placement
hover.tip('text', '.target', { placement: 'sideways' });
// @ts-expect-error not an option
hover.tip('text', '.target', { glow: true });

menu.addButton({ text: 'Button', action: () => true, note: () => undefined, top: true });
menu.addButton({ text: () => Translation.CLOSE, url: 'https://example.com', keep: true });
// @ts-expect-error a button needs text
menu.addButton({ action() {} });
// @ts-expect-error hidden is a function
menu.addButton({ text: 'Button', hidden: true });
menu.isOpen() satisfies boolean;
menu.open();
menu.close();

cardHelper.max('LEGENDARY') satisfies number | undefined;
cardHelper.dustGain('EPIC', true) satisfies number | null;
cardHelper.dustCost(document.createElement('div')) satisfies number | null;
cardHelper.getCardData(5).name satisfies string;
cardHelper.cardName({ id: 1, name: 'Name' }) satisfies string;
cardHelper.find(5, true) satisfies Element | undefined;
// @ts-expect-error a rarity is not a number
cardHelper.max(5);
// @ts-expect-error an element is needed
cardHelper.isShiny('card');

Plugin('My plugin', '1.0.0') satisfies Readonly<UnderScriptPlugin>;
Plugin('My plugin', 1);
registerModule('module', (plugin) => plugin.name, 'dependency', ['a', 'b']);
getPluginNames() satisfies string[];
getVersion('My plugin') satisfies string;
// @ts-expect-error a module needs a function
registerModule('module', 'not a function');

notify('text') satisfies void;
notify('text', 'title');
// @ts-expect-error notifications need text
notify();

quests.getQuests()[0].id satisfies string;
quests.fetch(({ quests: list, error }) => {
  list?.length satisfies number | undefined;
  error satisfies unknown;
});
// @ts-expect-error the callback is a function
quests.fetch('callback');

chatCommands.register({
  command: 'ping',
  usage: '<name>',
  handler(data) {
    data.text satisfies string;
    this.canceled = true;
  },
});
chatCommands.register({ command: 'quiet', enabled: () => false, setting: false });
chatCommands.list()[0].available() satisfies boolean;
// @ts-expect-error a command needs a name
chatCommands.register({ description: 'nameless' });
// @ts-expect-error enabled is a function
chatCommands.register({ command: 'bad', enabled: false });

loadDeck.load({ cards: [{ id: 1 }, { id: 2, shiny: true }], artifacts: [3, { id: 4 }], validate: true });
loadDeck.clear() satisfies void;
// @ts-expect-error cards need an id
loadDeck.load({ cards: [{ shiny: true }] });

const tabs = TabManager();
tabs.addTab('One', 'content').setActive();
tabs.render() satisfies string;
// @ts-expect-error not a tab manager method
tabs.nope();

export {};
