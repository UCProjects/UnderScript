import { expect } from 'chai';
import 'src/base/plugin/logger';
import 'src/base/plugin/hotkey';
import Hotkey from 'src/utils/hotkey.class';
import { hotkeys } from 'src/utils/1.variables';
import { switchOff, switchOn } from '../../setup/inactive';

let counter = 0;

describe('plugin hotkeys', () => {
  it('does not run a hotkey while the plugin is switched off', () => {
    counter += 1;
    const name = `Hotkey test ${counter}`;
    const plugin = globalThis.underscript.plugin(name);
    let ran = 0;
    const hotkey = new Hotkey('test hotkey', () => { ran += 1; }, { keys: 'KeyQ' });
    plugin.hotkey.register(hotkey);
    const wrapper = hotkeys.find((entry) => entry.hotkey === hotkey);
    wrapper.run({});
    switchOff(name);
    wrapper.run({});
    switchOn(name);
    wrapper.run({});
    expect(ran).to.equal(2);
    plugin.hotkey.unregister(hotkey);
  });
});
