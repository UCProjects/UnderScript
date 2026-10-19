import { expect } from 'chai';
import { switchOff, switchOn } from '../../setup/inactive';

let counter = 0;

describe('plugin commands', () => {
  let list;
  let settings;
  let eventManager;
  let errors;
  const originalError = console.error; // eslint-disable-line no-console

  const setup = () => {
    counter += 1;
    const name = `Commands test ${counter}`;
    return { name, namespace: `Commands-test-${counter}`, plugin: globalThis.underscript.plugin(name) };
  };
  const send = (command, text = '', room = 'chat-public-1') => {
    const data = { room, command, text, output: undefined };
    const { canceled } = eventManager.emit({ cancelable: true }, 'Chat:command', data);
    return { canceled, data };
  };
  const find = (command, owner) => list().find((entry) => entry.command === command && entry.owner === owner);

  before(async () => {
    ['Element', 'HTMLElement', 'Node', 'navigator', 'MutationObserver', 'getComputedStyle'].forEach((key) => {
      globalThis[key] ??= window[key];
    });
    await import('src/base/plugin/logger');
    await import('src/base/plugin/commands');
    ({ list } = await import('../../../src/utils/chatCommands'));
    settings = await import('../../../src/utils/settings/index');
    eventManager = (await import('../../../src/utils/eventManager')).default;
  });

  beforeEach(() => {
    errors = [];
    console.error = (...args) => errors.push(args); // eslint-disable-line no-console
  });

  afterEach(() => {
    console.error = originalError; // eslint-disable-line no-console
  });

  describe('register', () => {
    it('lists the command with the plugin as its owner', () => {
      const { name, plugin } = setup();
      plugin.commands.register({ command: 'plugroll', description: 'Rolls a die', usage: '<sides>', icon: '/images/die.png' });
      const entry = find('plugroll', name);
      expect(entry.description).to.equal('Rolls a die');
      expect(entry.usage).to.equal('<sides>');
      expect(entry.icon).to.equal('/images/die.png');
      expect(entry.qualified).to.equal(`${name.replace(/ /g, '-')}:plugroll`);
    });

    it('cannot choose another owner', () => {
      const { name, plugin } = setup();
      plugin.commands.register({ command: 'plugowner', owner: 'UnderScript' });
      expect(find('plugowner', 'UnderScript')).to.equal(undefined);
      expect(find('plugowner', name)).to.not.equal(undefined);
    });

    it('does not make a setting', () => {
      const { plugin } = setup();
      plugin.commands.register({ command: 'plugnosetting', setting: true, handler() {} });
      expect(settings.exists('underscript.command.plugnosetting')).to.equal(false);
    });

    it('is frozen', () => {
      const { plugin } = setup();
      expect(Object.isFrozen(plugin.commands)).to.equal(true);
    });

    it('lets two plugins use the same name', () => {
      const first = setup();
      const second = setup();
      first.plugin.commands.register({ command: 'plugtied' });
      second.plugin.commands.register({ command: 'plugtied' });
      expect(find('plugtied', first.name)).to.not.equal(undefined);
      expect(find('plugtied', second.name)).to.not.equal(undefined);
    });
  });

  describe('validation', () => {
    it('only accepts letters, numbers, dashes and underscores in a name', () => {
      const { plugin } = setup();
      ['', 'two words', 'with:colon', 'slash/y', 'émoji', '/name', 5, null, undefined].forEach((command) => {
        expect(() => plugin.commands.register({ command }), `${command}`)
          .to.throw('Command names can only contain letters, numbers, - and _');
      });
      ['plug-ok', 'plug_ok', 'PlugOk1'].forEach((command) => {
        expect(() => plugin.commands.register({ command })).to.not.throw();
      });
    });

    it('needs an options object', () => {
      const { plugin } = setup();
      ['text', 5, null, undefined].forEach((options) => {
        expect(() => plugin.commands.register(options)).to.throw('Command options must be provided');
      });
    });

    it('checks the types of the other options', () => {
      const { plugin } = setup();
      expect(() => plugin.commands.register({ command: 'plugtype', description: 5 }))
        .to.throw('Command description must be a string');
      expect(() => plugin.commands.register({ command: 'plugtype', usage: 5 }))
        .to.throw('Command usage must be a string');
      expect(() => plugin.commands.register({ command: 'plugtype', enabled: true }))
        .to.throw('Command enabled must be a function');
      expect(() => plugin.commands.register({ command: 'plugtype', handler: 'run' }))
        .to.throw('Command handler must be a function');
      expect(() => plugin.commands.register({ command: 'plugtype', icon: '' }))
        .to.throw('Command icon must be an image address');
    });

    it('takes text that is made when it is shown, such as a translation', () => {
      const { name, plugin } = setup();
      const text = { toString: () => 'Made later' };
      plugin.commands.register({ command: 'plugtext', description: text, usage: text });
      expect(`${find('plugtext', name).description}`).to.equal('Made later');
      expect(`${find('plugtext', name).usage}`).to.equal('Made later');
    });

    it('does not keep a command that failed to register', () => {
      const { name, plugin } = setup();
      expect(() => plugin.commands.register({ command: 'plugfailed', icon: 5 })).to.throw();
      expect(find('plugfailed', name)).to.equal(undefined);
      expect(() => plugin.commands.register({ command: 'plugfailed' })).to.not.throw();
    });

    it('does not let a plugin register the same command twice', () => {
      const { plugin } = setup();
      plugin.commands.register({ command: 'plugtwice' });
      expect(() => plugin.commands.register({ command: 'plugtwice' })).to.throw('Command "plugtwice" is already registered');
    });
  });

  describe('handler', () => {
    it('gets the channel, the command and what was typed after it', () => {
      const { plugin } = setup();
      let seen;
      plugin.commands.register({
        command: 'plugseen',
        handler(command) {
          seen = command;
        },
      });
      send('plugseen', 'a b', 'chat-private-9');
      expect(seen.channel.room).to.equal('chat-private-9');
      expect(seen.channel.type).to.equal('private');
      expect(seen.command).to.equal('plugseen');
      expect(seen.text).to.equal('a b');
    });

    it('can cancel the message', () => {
      const { plugin } = setup();
      plugin.commands.register({
        command: 'plugcancel',
        handler() {
          this.canceled = true;
        },
      });
      expect(send('plugcancel').canceled).to.equal(true);
    });

    it('can replace what is sent', () => {
      const { plugin } = setup();
      plugin.commands.register({
        command: 'plugoutput',
        handler(command) {
          command.output = `rolled ${command.text}`;
        },
      });
      expect(send('plugoutput', '6').data.output).to.equal('rolled 6');
    });

    it('gets the plain name when it was typed with the owner', () => {
      const { namespace, plugin } = setup();
      let seen;
      plugin.commands.register({ command: 'plugqualified', handler(command) { seen = command.command; } });
      send(`${namespace}:plugqualified`);
      expect(seen).to.equal('plugqualified');
    });

    it('runs only for the plugin that was named when two share a name', () => {
      const first = setup();
      const second = setup();
      const ran = [];
      first.plugin.commands.register({ command: 'plugboth', handler() { ran.push('first'); } });
      second.plugin.commands.register({ command: 'plugboth', handler() { ran.push('second'); } });
      send(`${second.namespace}:plugboth`);
      expect(ran).to.deep.equal(['second']);
    });

    it('is skipped in a room the chat does not know', () => {
      const { plugin } = setup();
      let ran = false;
      plugin.commands.register({ command: 'plugroom', handler() { ran = true; } });
      send('plugroom', '', 'somewhere');
      expect(ran).to.equal(false);
    });

    it('logs an error under the plugin name and lets the message go on', () => {
      const { name, plugin } = setup();
      plugin.commands.register({ command: 'plugthrows', handler() { throw new Error('boom'); } });
      expect(send('plugthrows').canceled).to.equal(false);
      const logged = errors.find((args) => args.some((arg) => typeof arg === 'string' && arg.includes(name)));
      expect(logged, 'error logged with the plugin name').to.not.equal(undefined);
      expect(logged.some((arg) => typeof arg === 'string' && arg.includes('/plugthrows'))).to.equal(true);
      expect(logged.some((arg) => arg instanceof Error && arg.message === 'boom')).to.equal(true);
    });

    it('logs a rejected promise the same way', async () => {
      const { name, plugin } = setup();
      plugin.commands.register({ command: 'plugrejects', handler: () => Promise.reject(new Error('later')) });
      send('plugrejects');
      await new Promise((resolve) => { setTimeout(resolve, 0); });
      expect(errors.some((args) => args.some((arg) => typeof arg === 'string' && arg.includes(name)))).to.equal(true);
    });
  });

  describe('while the plugin is switched off', () => {
    it('hides the command and does not run its handler', () => {
      const { name, plugin } = setup();
      let ran = 0;
      plugin.commands.register({ command: 'plugswitched', handler() { ran += 1; } });
      send('plugswitched');
      expect(find('plugswitched', name)).to.not.equal(undefined);
      switchOff(name);
      expect(find('plugswitched', name)).to.equal(undefined);
      send('plugswitched');
      switchOn(name);
      expect(find('plugswitched', name)).to.not.equal(undefined);
      send('plugswitched');
      expect(ran).to.equal(2);
    });
  });

  describe('enabled', () => {
    it('hides the command and its handler while it says no', () => {
      const { name, plugin } = setup();
      let on = false;
      let ran = 0;
      plugin.commands.register({ command: 'plugenabled', enabled: () => on, handler() { ran += 1; } });
      expect(find('plugenabled', name)).to.equal(undefined);
      send('plugenabled');
      on = true;
      expect(find('plugenabled', name)).to.not.equal(undefined);
      send('plugenabled');
      expect(ran).to.equal(1);
    });

    it('treats a throwing function as no, and logs it once', () => {
      const { name, plugin } = setup();
      plugin.commands.register({ command: 'plugenabledthrows', enabled() { throw new Error('nope'); } });
      expect(find('plugenabledthrows', name)).to.equal(undefined);
      expect(find('plugenabledthrows', name)).to.equal(undefined);
      list();
      const logged = errors.filter((args) => args.some((arg) => arg instanceof Error && arg.message === 'nope'));
      expect(logged).to.have.length(1);
    });
  });

  describe('without a handler', () => {
    it('is turned back into the plain name when typed with the owner', () => {
      const { namespace, plugin } = setup();
      plugin.commands.register({ command: 'plugserver' });
      expect(send(`${namespace}:plugserver`, 'a b').data.output).to.equal('/plugserver a b');
      expect(send('plugserver', 'a b').data.output).to.equal(undefined);
    });
  });

  describe('remove', () => {
    it('takes the command out of the list and stops its handler', () => {
      const { name, plugin } = setup();
      let ran = 0;
      const handle = plugin.commands.register({ command: 'plugremove', handler() { ran += 1; } });
      send('plugremove');
      expect(handle.remove()).to.equal(true);
      send('plugremove');
      expect(ran).to.equal(1);
      expect(find('plugremove', name)).to.equal(undefined);
    });

    it('only works once', () => {
      const { plugin } = setup();
      const handle = plugin.commands.register({ command: 'plugremoveonce' });
      expect(handle.remove()).to.equal(true);
      expect(handle.remove()).to.equal(false);
    });

    it('lets the plugin register the same command again', () => {
      const { name, plugin } = setup();
      plugin.commands.register({ command: 'plugagain' }).remove();
      expect(() => plugin.commands.register({ command: 'plugagain' })).to.not.throw();
      expect(find('plugagain', name)).to.not.equal(undefined);
    });

    it('leaves another plugin with the same name alone', () => {
      const first = setup();
      const second = setup();
      const handle = first.plugin.commands.register({ command: 'plugremovetied' });
      second.plugin.commands.register({ command: 'plugremovetied' });
      handle.remove();
      expect(find('plugremovetied', first.name)).to.equal(undefined);
      expect(find('plugremovetied', second.name)).to.not.equal(undefined);
    });

    it('cannot be used to remove a command that was registered again', () => {
      const { name, plugin } = setup();
      const old = plugin.commands.register({ command: 'plugstale' });
      old.remove();
      plugin.commands.register({ command: 'plugstale' });
      expect(old.remove()).to.equal(false);
      expect(find('plugstale', name)).to.not.equal(undefined);
    });
  });
});
