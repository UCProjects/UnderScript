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

  it('defaults a text setting to an empty string', () => {
    const setting = register({ key: 'test.register.text', type: 'text' });
    expect(setting.value()).to.equal('');
  });

  it('reports a converter that throws to the plugin and keeps the stored value', () => {
    const errors = [];
    localStorage.setItem('test.register.converter', 'old');
    const setting = register({
      key: 'test.register.converter',
      type: 'text',
      page: { name: 'Converter plugin', logger: { error: (...args) => errors.push(args) } },
      converter() {
        throw new Error('broken');
      },
    });
    expect(setting.value()).to.equal('old');
    expect(errors).to.have.length(1);
    expect(errors[0][0]).to.contain('test.register.converter converter');
  });

  it('reports an onChange that throws to the plugin and still emits the change', () => {
    const errors = [];
    const changes = [];
    const setting = register({
      key: 'test.register.onchange',
      type: 'text',
      page: { name: 'OnChange plugin', logger: { error: (...args) => errors.push(args) } },
      onChange() {
        throw new Error('broken');
      },
    });
    setting.on((value) => changes.push(value));
    setting.set('new');
    expect(errors).to.have.length(1);
    expect(errors[0][0]).to.contain('test.register.onchange onChange');
    expect(changes).to.deep.equal(['new']);
  });

  it('reports a converter on a plugin tab to the plugin', () => {
    const errors = [];
    localStorage.setItem('test.register.tab', 'old');
    register({
      key: 'test.register.tab',
      type: 'text',
      page: { name: 'Tab plugin', logger: { error: (...args) => errors.push(args) } },
      tab: 'Advanced',
      converter() {
        throw new Error('broken');
      },
    });
    expect(errors).to.have.length(1);
  });
});
