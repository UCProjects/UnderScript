import { expect } from 'chai';

describe('underscript constants', () => {
  let constants;

  before(async () => {
    await import('../../../src/base/api/constants');
    ({ constants } = globalThis.underscript);
  });

  it('finds an item by name', () => {
    expect(constants.isItem('gold')).to.equal(true);
    expect(`${constants.getItem('gold')}`).to.equal('Gold');
  });

  it('finds a priority by name', () => {
    expect(constants.isPriority('high')).to.equal(true);
    expect(`${constants.getPriority('high')}`).to.equal('high');
  });

  it('exposes the rarities', () => {
    expect(`${globalThis.underscript.rarity.LEGENDARY}`).to.equal('LEGENDARY');
    expect(globalThis.underscript.rarity.TOKEN.equals('GENERATED')).to.equal(true);
  });

  it('finds a rarity by name', () => {
    expect(constants.isRarity('DT')).to.equal(true);
    expect(constants.getRarity('DT')).to.equal(globalThis.underscript.rarity.DETERMINATION);
  });

  it('knows when something is not a rarity', () => {
    expect(constants.isRarity('NOT_A_RARITY')).to.equal(false);
    expect(constants.getRarity('NOT_A_RARITY')).to.equal(undefined);
  });

  it('knows when something is not a priority', () => {
    expect(constants.isPriority('not a priority')).to.equal(false);
    expect(constants.getPriority('not a priority')).to.equal(undefined);
  });
});
