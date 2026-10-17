import { expect } from 'chai';

describe('chat commands', () => {
  let list;
  let register;
  let commandSetting;
  let eventManager;

  const find = (command) => list().find((entry) => entry.command === command);

  before(async () => {
    ['Element', 'HTMLElement', 'Node', 'navigator', 'MutationObserver', 'getComputedStyle'].forEach((name) => {
      globalThis[name] ??= window[name];
    });
    ({ list, register, commandSetting } = await import('../../src/utils/chatCommands'));
    eventManager = (await import('../../src/utils/eventManager')).default;
  });

  const send = (command, text = '') => {
    const data = { command, text, output: undefined };
    const { canceled } = eventManager.emit({ cancelable: true }, 'Chat:command', data);
    return { canceled, data };
  };

  it('belong to UnderScript unless told otherwise', () => {
    register({ command: 'owned-by-default' });
    expect(find('owned-by-default').owner).to.equal('UnderScript');
  });

  it('remember who owns them and their icon', () => {
    register({ command: 'owned-by-plugin', owner: 'My plugin', icon: '/images/plugin.png' });
    const entry = find('owned-by-plugin');
    expect(entry.owner).to.equal('My plugin');
    expect(entry.icon).to.equal('/images/plugin.png');
  });

  it('have no icon unless given one', () => {
    register({ command: 'without-icon', owner: 'Someone' });
    expect(find('without-icon').icon).to.equal(undefined);
  });

  it('need an owner that is a name', () => {
    ['', '   ', 5, null].forEach((owner) => {
      expect(() => register({ command: 'bad-owner', owner })).to.throw('Command owner must be a name');
    });
    expect(find('bad-owner')).to.equal(undefined);
  });

  it('need an icon that is an address', () => {
    ['', '   ', 5, null].forEach((icon) => {
      expect(() => register({ command: 'bad-icon', icon })).to.throw('Command icon must be an image address');
    });
    expect(find('bad-icon')).to.equal(undefined);
  });

  it('still need a name', () => {
    expect(() => register({ owner: 'Someone' })).to.throw('Command name must be provided');
  });

  it('are listed only while they are enabled', () => {
    let enabled = false;
    register({ command: 'switchable', enabled: () => enabled });
    expect(find('switchable')).to.equal(undefined);
    enabled = true;
    expect(find('switchable').owner).to.equal('UnderScript');
  });

  describe('qualified names', () => {
    it('are the owner and the command, as they were written', () => {
      register({ command: 'qualifydefault' });
      register({ command: 'qualifyowned', owner: 'My Great Plugin' });
      expect(find('qualifydefault').qualified).to.equal('UnderScript:qualifydefault');
      expect(find('qualifyowned').qualified).to.equal('My-Great-Plugin:qualifyowned');
    });

    it('turn every space and colon of the owner into a dash', () => {
      register({ command: 'qualifyodd', owner: '  Odd: Name  ' });
      expect(find('qualifyodd').qualified).to.equal('Odd--Name:qualifyodd');
    });

    it('run only the handler of that owner', () => {
      const ran = [];
      register({ command: 'tied', owner: 'Alpha', handler() { ran.push('alpha'); } });
      register({ command: 'tied', owner: 'Beta', handler() { ran.push('beta'); } });
      send('Beta:tied');
      expect(ran).to.deep.equal(['beta']);
      send('Alpha:tied');
      expect(ran).to.deep.equal(['beta', 'alpha']);
    });

    it('are understood only in the case they were written', () => {
      const ran = [];
      register({ command: 'tiedcase', owner: 'Gamma', handler() { ran.push('gamma'); } });
      send('GAMMA:tiedcase');
      send('gamma:tiedcase');
      expect(ran).to.deep.equal([]);
      send('Gamma:tiedcase');
      expect(ran).to.deep.equal(['gamma']);
    });

    it('keep owners that differ in case apart', () => {
      const ran = [];
      register({ command: 'tiedowners', owner: 'My Plugin', handler() { ran.push('upper'); } });
      register({ command: 'tiedowners', owner: 'my plugin', handler() { ran.push('lower'); } });
      send('my-plugin:tiedowners');
      expect(ran).to.deep.equal(['lower']);
      send('My-Plugin:tiedowners');
      expect(ran).to.deep.equal(['lower', 'upper']);
    });

    it('leave a name with several owners to the first handler that cancels it', () => {
      const ran = [];
      register({
        command: 'tiedplain',
        owner: 'Alpha',
        handler() {
          ran.push('alpha');
          this.canceled = true;
        },
      });
      register({ command: 'tiedplain', owner: 'Beta', handler() { ran.push('beta'); } });
      expect(send('tiedplain').canceled).to.equal(true);
      expect(ran).to.deep.equal(['alpha']);
    });

    it('run every handler of a name when none of them cancel it', () => {
      const ran = [];
      register({ command: 'tiedopen', owner: 'Alpha', handler() { ran.push('alpha'); } });
      register({ command: 'tiedopen', owner: 'Beta', handler() { ran.push('beta'); } });
      send('tiedopen');
      expect(ran).to.deep.equal(['alpha', 'beta']);
    });

    it('do not run a handler that is disabled', () => {
      let ran = false;
      register({ command: 'tieddisabled', owner: 'Delta', enabled: () => false, handler() { ran = true; } });
      send('delta:tieddisabled');
      expect(ran).to.equal(false);
    });

    it('are turned back into the plain name for a command the server handles', () => {
      register({ command: 'serverside', owner: 'Undercards' });
      expect(send('Undercards:serverside', 'a reason').data.output).to.equal('/serverside a reason');
      expect(send('Undercards:serverside').data.output).to.equal('/serverside');
    });

    it('leave the plain name of a command the server handles alone', () => {
      register({ command: 'serversideplain', owner: 'Undercards' });
      expect(send('serversideplain', 'a reason').data.output).to.equal(undefined);
    });
  });

  describe('removal', () => {
    it('takes a command out of the list', () => {
      const handle = register({ command: 'removable' });
      expect(find('removable')).to.not.equal(undefined);
      expect(handle.remove()).to.equal(true);
      expect(find('removable')).to.equal(undefined);
    });

    it('stops its handler from running', () => {
      let ran = 0;
      const handle = register({ command: 'removablehandler', handler() { ran += 1; } });
      send('removablehandler');
      handle.remove();
      send('removablehandler');
      expect(ran).to.equal(1);
    });

    it('stops the plain name of a server command being restored', () => {
      const handle = register({ command: 'removableserver', owner: 'Undercards' });
      expect(send('Undercards:removableserver').data.output).to.equal('/removableserver');
      handle.remove();
      expect(send('Undercards:removableserver').data.output).to.equal(undefined);
    });

    it('only works once', () => {
      const handle = register({ command: 'removableonce' });
      expect(handle.remove()).to.equal(true);
      expect(handle.remove()).to.equal(false);
    });

    it('leaves other owners of the same name alone', () => {
      const ran = [];
      const first = register({ command: 'removabletied', owner: 'Alpha', handler() { ran.push('alpha'); } });
      register({ command: 'removabletied', owner: 'Beta', handler() { ran.push('beta'); } });
      first.remove();
      send('removabletied');
      expect(ran).to.deep.equal(['beta']);
      expect(list().filter(({ command }) => command === 'removabletied')).to.have.length(1);
    });

    it('lets the same command be registered again', () => {
      register({ command: 'removableagain' }).remove();
      register({ command: 'removableagain' });
      expect(find('removableagain')).to.not.equal(undefined);
    });
  });

  describe('command settings', () => {
    it('are named after the command', () => {
      const setting = commandSetting('settingnamed');
      expect(setting.key).to.equal('underscript.command.settingnamed');
      expect(setting.value()).to.equal(false);
    });

    it('can be switched on and off', () => {
      const setting = commandSetting('settingswitch');
      setting.set(true);
      expect(setting.value()).to.equal(true);
      setting.set(false);
      expect(setting.value()).to.equal(false);
    });

    it('cannot be made twice for the same command', () => {
      commandSetting('settingtwice');
      expect(() => commandSetting('settingtwice')).to.throw('already registered');
    });

    it('switch a command off when its enabled function uses them', () => {
      const setting = commandSetting('settingused');
      register({ command: 'settingused', enabled: () => !setting.value() });
      expect(find('settingused')).to.not.equal(undefined);
      setting.set(true);
      expect(find('settingused')).to.equal(undefined);
    });
  });
});
