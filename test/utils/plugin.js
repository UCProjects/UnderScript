import { expect } from 'chai';
import 'src/utils/plugin';
import { switchOff, switchOn } from '../setup/inactive';

const { plugin: create } = globalThis.underscript;

describe('plugin names', () => {
  it('are accepted when nothing is wrong with them', () => {
    expect(create('Plugin Names Fine').name).to.equal('Plugin Names Fine');
  });

  it('cannot be UnderScript or Undercards', () => {
    expect(() => create('UnderScript')).to.throw('Name is reserved (UnderScript)');
    expect(() => create('Undercards')).to.throw('Name is reserved (Undercards)');
  });

  it('cannot be a reserved name in another case', () => {
    ['underscript', 'UNDERSCRIPT', 'UnDeRsCrIpT', 'undercards', 'UNDERCARDS'].forEach((name) => {
      expect(() => create(name)).to.throw(`Name is reserved (${name})`);
    });
  });

  it('cannot be a reserved name with spaces around it', () => {
    expect(() => create('  underscript  ')).to.throw('Name is reserved (underscript)');
  });

  it('can contain a reserved name', () => {
    expect(create('UnderScript Stats').name).to.equal('UnderScript Stats');
    expect(create('My Undercards').name).to.equal('My Undercards');
  });

  it('can be close to a reserved name', () => {
    expect(create('Under Script').name).to.equal('Under Script');
  });

  it('still cannot be used twice', () => {
    create('Plugin Names Twice');
    expect(() => create('Plugin Names Twice')).to.throw('Name already registered (Plugin Names Twice)');
  });

  it('still cannot be too long or contain odd characters', () => {
    expect(() => create('A name that is far too long')).to.throw('Plugin name too long');
    expect(() => create('Bad-Name')).to.throw('Name contains illegal characters (Bad-Name)');
  });
});

describe('plugin.isActive', () => {
  it('is true for a plugin nothing has switched off', () => {
    expect(create('Active Default').isActive).to.equal(true);
  });

  it('follows the enabled switch when something provides it', () => {
    const plugin = create('Active Switched');
    expect(plugin.isActive).to.equal(true);
    switchOff('Active Switched');
    expect(plugin.isActive).to.equal(false);
    switchOn('Active Switched');
    expect(plugin.isActive).to.equal(true);
  });
});
