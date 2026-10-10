import Translation from 'src/structures/constants/translation';
import { blankToast, dismissable, errorToast, infoToast, toast } from 'src/utils/2.toasts';
import * as cardHelper from 'src/utils/cardHelper';
import * as hover from 'src/utils/hover';
import * as menu from 'src/utils/menu';
import Plugin, { getPluginNames, getVersion, registerModule } from 'src/utils/plugin';

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

export {};
