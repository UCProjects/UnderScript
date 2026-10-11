import { expect } from 'chai';

describe('settings register', () => {
  let register;

  before(async () => {
    ['Element', 'HTMLElement', 'Node', 'navigator', 'MutationObserver', 'getComputedStyle'].forEach((name) => {
      globalThis[name] ??= window[name];
    });
    ({ register } = await import('../../src/utils/settings/index'));
  });

  it('returns the setting', () => {
    const setting = register({ key: 'test.register.valid', default: true });
    expect(setting.key).to.equal('test.register.valid');
    expect(setting.value()).to.equal(true);
  });

  it('throws on a type nobody registered', () => {
    expect(() => register({ key: 'test.register.unknown', type: 'slidr' }))
      .to.throw('test.register.unknown has an unknown setting type: "slidr"');
  });

  it('does not reserve the key of a setting that failed', () => {
    expect(() => register({ key: 'test.register.retry', type: 'slidr' })).to.throw();
    const setting = register({ key: 'test.register.retry', type: 'slider', min: 0, max: 5 });
    expect(setting.key).to.equal('test.register.retry');
  });
});
