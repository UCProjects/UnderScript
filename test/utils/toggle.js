import { expect } from 'chai';
import Toggle from '../../src/utils/Toggle';

describe('Toggle', () => {
  it('starts off', () => {
    expect(new Toggle().value).to.equal(false);
  });

  it('can start on', () => {
    expect(new Toggle(true).value).to.equal(true);
  });

  it('turns on and off and returns the new value', () => {
    const toggle = new Toggle();
    expect(toggle.on()).to.equal(true);
    expect(toggle.value).to.equal(true);
    expect(toggle.off()).to.equal(false);
    expect(toggle.value).to.equal(false);
  });

  it('flips', () => {
    const toggle = new Toggle();
    expect(toggle.flip()).to.equal(true);
    expect(toggle.flip()).to.equal(false);
  });

  it('keeps the VarStore behavior', () => {
    const toggle = new Toggle(true);
    toggle.off();
    expect(toggle.isSet()).to.equal(true);
    toggle.reset();
    expect(toggle.value).to.equal(true);
    toggle.value = false;
    expect(toggle.get()).to.equal(false);
  });

  it('hands back the value and resets on consume', () => {
    const toggle = new Toggle();
    toggle.on();
    expect(toggle.consume()).to.equal(true);
    expect(toggle.value).to.equal(false);
  });
});
