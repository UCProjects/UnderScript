import { expect } from 'chai';

describe('built-in commands', () => {
  let underscript;
  let undercards;
  let list;
  let eventManager;
  let settings;
  let originalScroll;

  const send = (command, room = 'chat-public-1') => {
    const data = { room, command, text: '', output: undefined };
    const { canceled } = eventManager.emit({ cancelable: true }, 'Chat:command', data);
    return { canceled, data };
  };

  before(async () => {
    ['Element', 'HTMLElement', 'Node', 'navigator', 'MutationObserver', 'getComputedStyle'].forEach((key) => {
      globalThis[key] ??= window[key];
    });
    underscript = (await import('../../../src/utils/underscript')).default;
    undercards = (await import('../../../src/utils/undercards')).default;
    await import('../../../src/base/chat/commands/scroll');
    ({ list } = await import('../../../src/utils/chatCommands'));
    settings = await import('../../../src/utils/settings/index');
    eventManager = (await import('../../../src/utils/eventManager')).default;
  });

  beforeEach(() => {
    originalScroll = globalThis.scroll;
  });

  afterEach(() => {
    globalThis.scroll = originalScroll;
  });

  describe('the internal plugins', () => {
    it('are named UnderScript and Undercards', () => {
      expect(underscript.name).to.equal('UnderScript');
      expect(undercards.name).to.equal('Undercards');
    });

    it('can register commands', () => {
      expect(underscript.commands.register).to.be.a('function');
      expect(undercards.commands.register).to.be.a('function');
    });

    it('list their commands under their own names', () => {
      const handle = undercards.commands.register({ command: 'internalowner' });
      const entry = list().find(({ command }) => command === 'internalowner');
      expect(entry.owner).to.equal('Undercards');
      expect(entry.qualified).to.equal('Undercards:internalowner');
      handle.remove();
    });
  });

  describe('/scroll', () => {
    it('is listed under UnderScript', () => {
      const entry = list().find(({ command }) => command === 'scroll');
      expect(entry.owner).to.equal('UnderScript');
      expect(entry.qualified).to.equal('UnderScript:scroll');
    });

    it('has a setting named after it', () => {
      expect(settings.exists('underscript.command.scroll')).to.equal(true);
    });

    it('scrolls the chat it was typed in and stops the message', () => {
      document.body.innerHTML = '<div id="chat-public-1"></div><div id="chat-private-9"></div>';
      const scrolled = [];
      globalThis.scroll = (target, animate) => scrolled.push([target[0].id, animate]);
      expect(send('scroll', 'chat-private-9').canceled).to.equal(true);
      expect(scrolled).to.deep.equal([['chat-private-9', true]]);
    });

    it('also answers to the owner and the command', () => {
      document.body.innerHTML = '<div id="chat-public-1"></div>';
      const scrolled = [];
      globalThis.scroll = (target) => scrolled.push(target[0].id);
      expect(send('UnderScript:scroll').canceled).to.equal(true);
      expect(scrolled).to.deep.equal(['chat-public-1']);
    });
  });
});
