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
    expect(`${constants.rarity.LEGENDARY}`).to.equal('LEGENDARY');
    expect(constants.rarity.TOKEN.equals('GENERATED')).to.equal(true);
  });

  it('finds a rarity by name', () => {
    expect(constants.isRarity('DT')).to.equal(true);
    expect(constants.getRarity('DT')).to.equal(constants.rarity.DETERMINATION);
  });

  it('exposes the souls, including the one nobody can play', () => {
    const { soul } = constants;
    expect(Object.keys(soul)).to.deep.equal([
      'KINDNESS',
      'DETERMINATION',
      'PATIENCE',
      'BRAVERY',
      'JUSTICE',
      'PERSEVERANCE',
      'INTEGRITY',
      'MONSTER',
    ]);
    expect(`${soul.MONSTER}`).to.equal('MONSTER');
    expect(soul.MONSTER.playable).to.equal(false);
    expect(soul.BRAVERY.playable).to.equal(true);
  });

  it('finds a soul by name', () => {
    expect(constants.isSoul('BRAVERY')).to.equal(true);
    expect(constants.getSoul('BRAVERY')).to.equal(constants.soul.BRAVERY);
    expect(constants.isSoul('NOT_A_SOUL')).to.equal(false);
    expect(constants.getSoul('NOT_A_SOUL')).to.equal(undefined);
  });

  it('keeps item, priority and rarity at the top level, with a warning once', () => {
    const warnings = [];
    const { warn } = console;
    console.warn = (message) => warnings.push(message);
    try {
      const { underscript } = globalThis;
      expect(underscript.item.GOLD).to.equal(constants.item.GOLD);
      expect(underscript.item.UCP).to.equal(constants.item.UCP);
      expect(underscript.priority.HIGH).to.equal(constants.priority.HIGH);
      expect(underscript.rarity.EPIC).to.equal(constants.rarity.EPIC);
    } finally {
      console.warn = warn;
    }
    expect(warnings).to.deep.equal([
      "'underscript.item' is deprecated, use 'underscript.constants.item' instead.",
      "'underscript.priority' is deprecated, use 'underscript.constants.priority' instead.",
      "'underscript.rarity' is deprecated, use 'underscript.constants.rarity' instead.",
    ]);
  });

  it('has no top level soul', () => {
    expect(globalThis.underscript.soul).to.equal(undefined);
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
