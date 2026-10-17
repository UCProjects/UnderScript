import { expect } from 'chai';

describe('command suggestions', () => {
  let attach;
  let input;

  const suggest = (value) => {
    input.value = value;
    input.selectionStart = value.length;
    input.dispatchEvent(new window.Event('input'));
    return [...document.querySelectorAll('.autobox > div')];
  };

  before(async () => {
    ['Element', 'HTMLElement', 'Node', 'navigator', 'MutationObserver', 'getComputedStyle'].forEach((name) => {
      globalThis[name] ??= window[name];
    });
    ({ attach } = await import('../../../src/utils/autocomplete'));
    const { register } = await import('../../../src/utils/chatCommands');
    await import('../../../src/base/chat/autocomplete.commands');
    register({ command: 'suggestplain', description: 'Does a thing' });
    register({ command: 'suggestowned', owner: 'My plugin', icon: '/images/plugin.png' });
    register({ command: 'suggestusage', owner: 'Undercards', usage: '<name>' });
    register({ command: 'suggesttied', owner: 'Alpha', description: 'First' });
    register({ command: 'suggesttied', owner: 'Beta', description: 'Second' });
    register({ command: 'zzowned', owner: 'Zed Corp' });
    register({ command: 'zzsecond', owner: 'Zed Corp' });
    register({ command: 'zedcmd', owner: 'Other' });
    register({ command: 'dupcmd', owner: 'Dupper' });
  });

  beforeEach(() => {
    document.body.innerHTML = '<div><input type="text"></div>';
    input = document.querySelector('input');
    attach(input);
  });

  it('show who owns a command', () => {
    const [entry] = suggest('/suggestplain');
    expect(entry.querySelector('.autobox-owner').textContent).to.equal('UnderScript');
  });

  it('show the owner a plugin gave its command', () => {
    const [entry] = suggest('/suggestowned');
    expect(entry.querySelector('.autobox-owner').textContent).to.equal('My plugin');
  });

  it('show the icon of a command that has one', () => {
    const [entry] = suggest('/suggestowned');
    const icon = entry.querySelector('img.autobox-icon');
    expect(icon.getAttribute('src')).to.equal('/images/plugin.png');
    expect(icon.getAttribute('alt')).to.equal('');
  });

  it('show no icon for a command without one', () => {
    const [entry] = suggest('/suggestplain');
    expect(entry.querySelector('.autobox-icon')).to.equal(null);
  });

  it('keep the name highlighted and the description beside it', () => {
    const [entry] = suggest('/suggestpl');
    expect(entry.querySelector('strong').textContent).to.equal('suggestpl');
    expect(entry.textContent).to.contain('suggestplain');
    expect(entry.textContent).to.contain('Does a thing');
  });

  it('put the name before the owner', () => {
    const [entry] = suggest('/suggestplain');
    const row = entry.querySelector('.autobox-command');
    expect(row.lastElementChild.classList.contains('autobox-owner')).to.equal(true);
    expect(row.textContent.indexOf('suggestplain')).to.be.lessThan(row.textContent.indexOf('UnderScript'));
  });

  it('show the usage as a hint without an owner once the name is typed', () => {
    const [entry] = suggest('/suggestusage ');
    expect(entry.classList.contains('autobox-hint')).to.equal(true);
    expect(entry.textContent).to.contain('<name>');
    expect(entry.querySelector('.autobox-owner')).to.equal(null);
  });

  it('suggest nothing for a command that does not exist', () => {
    expect(suggest('/nosuchcommand')).to.have.length(0);
  });

  describe('when a command has several owners', () => {
    it('list each one with its owner', () => {
      const entries = suggest('/suggesttied');
      expect(entries).to.have.length(2);
      expect(entries.map((entry) => entry.querySelector('.autobox-owner').textContent)).to.deep.equal(['Alpha', 'Beta']);
    });

    it('complete to the owner and the command', () => {
      const [alpha, beta] = suggest('/suggesttied');
      beta.click();
      expect(input.value).to.equal('/Beta:suggesttied ');
      suggest('/suggesttied');
      alpha.click();
      expect(input.value).to.equal('/Alpha:suggesttied ');
    });

    it('suggest only that owner once the owner is typed, in any case', () => {
      const entries = suggest('/beta:sugg');
      expect(entries).to.have.length(1);
      expect(entries[0].querySelector('.autobox-owner').textContent).to.equal('Beta');
      expect(entries[0].querySelector('strong').textContent).to.equal('Beta:sugg');
    });
  });

  describe('when a command has one owner', () => {
    it('complete to the plain command', () => {
      const [entry] = suggest('/suggestplain');
      entry.click();
      expect(input.value).to.equal('/suggestplain ');
    });

    it('complete to the owner and the command when the owner was typed', () => {
      const [entry] = suggest('/my-plugin:sugg');
      entry.click();
      expect(input.value).to.equal('/My-plugin:suggestowned ');
    });

    it('still show the usage after the owner and the command', () => {
      const [entry] = suggest('/Undercards:suggestusage ');
      expect(entry.classList.contains('autobox-hint')).to.equal(true);
      expect(entry.textContent).to.contain('<name>');
    });
  });

  describe('when the query matches an owner', () => {
    it('lists the commands of that owner', () => {
      const [entry, ...rest] = suggest('/zed-c');
      expect(rest).to.have.length(1);
      expect(entry.querySelector('.autobox-owner').textContent).to.equal('Zed Corp');
      expect(entry.textContent).to.contain('Zed-Corp:zzowned');
      expect(entry.querySelector('strong').textContent).to.equal('Zed-C');
    });

    it('matches the owner in any case', () => {
      expect(suggest('/ZED-C')).to.have.length(2);
    });

    it('completes to the owner and the command', () => {
      const [entry] = suggest('/zed-c');
      entry.click();
      expect(input.value).to.equal('/Zed-Corp:zzowned ');
    });

    it('lists the commands that match by name before the ones that match by owner', () => {
      const entries = suggest('/zed');
      expect(entries).to.have.length(3);
      expect(entries[0].textContent).to.contain('zedcmd');
      expect(entries[0].textContent).to.not.contain(':');
      expect(entries[1].textContent).to.contain('Zed-Corp:zzowned');
      expect(entries[2].textContent).to.contain('Zed-Corp:zzsecond');
    });

    it('completes a command that matched by name to the plain command', () => {
      const [entry] = suggest('/zed');
      entry.click();
      expect(input.value).to.equal('/zedcmd ');
    });

    it('does not list a command twice when its name and its owner both match', () => {
      const entries = suggest('/dup');
      expect(entries).to.have.length(1);
      expect(entries[0].textContent).to.contain('dupcmd');
      expect(entries[0].textContent).to.not.contain('Dupper:dupcmd');
    });

    it('lists nothing for a start that matches neither a command nor an owner', () => {
      expect(suggest('/nobodyhasthis')).to.have.length(0);
    });
  });
});
