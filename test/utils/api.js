import { expect } from 'chai';

describe('underscript api', () => {
  let api;

  before(async () => {
    api = await import('../../src/utils/4.api');
  });

  after(() => {
    delete globalThis.underscript;
  });

  it('exposes the version', () => {
    expect(globalThis.underscript.version).to.equal(GM_info.script.version);
  });

  it('returns primitives untouched', () => {
    api.register('count', 3);
    api.register('flag', false);
    api.register('empty', null);
    expect(globalThis.underscript.count).to.equal(3);
    expect(globalThis.underscript.flag).to.equal(false);
    expect(globalThis.underscript.empty).to.equal(null);
  });

  it('protects registered objects from writes', () => {
    api.register('thing', { value: 1 });
    Reflect.set(globalThis.underscript.thing, 'value', 2);
    expect(globalThis.underscript.thing.value).to.equal(1);
  });

  it('keeps registered functions callable', () => {
    api.register('double', (n) => n * 2);
    expect(globalThis.underscript.double(4)).to.equal(8);
  });

  it('ignores writes to the api itself', () => {
    Reflect.set(globalThis.underscript, 'version', 'hacked');
    expect(globalThis.underscript.version).to.equal(GM_info.script.version);
  });

  describe('read only', () => {
    before(() => {
      api.register('readOnlyValue', 5);
      api.register('readOnlyObject', { inner: 1 });
    });

    it('does not allow redefining a property', () => {
      expect(() => Object.defineProperty(globalThis.underscript, 'readOnlyValue', { value: 6 })).to.throw(TypeError);
      expect(() => Object.defineProperty(globalThis.underscript.readOnlyObject, 'inner', { value: 2 })).to.throw(TypeError);
      expect(globalThis.underscript.readOnlyValue).to.equal(5);
      expect(globalThis.underscript.readOnlyObject.inner).to.equal(1);
    });

    it('does not allow deleting a property', () => {
      expect(Reflect.deleteProperty(globalThis.underscript, 'readOnlyValue')).to.equal(false);
      expect(Reflect.deleteProperty(globalThis.underscript.readOnlyObject, 'inner')).to.equal(false);
      expect(globalThis.underscript.readOnlyValue).to.equal(5);
      expect(globalThis.underscript.readOnlyObject.inner).to.equal(1);
    });

    it('does not allow changing the prototype', () => {
      expect(Reflect.setPrototypeOf(globalThis.underscript, {})).to.equal(false);
      expect(Reflect.setPrototypeOf(globalThis.underscript.readOnlyObject, null)).to.equal(false);
    });

    it('cannot be locked against later registrations', () => {
      expect(() => Object.freeze(globalThis.underscript)).to.throw(TypeError);
      expect(() => Object.preventExtensions(globalThis.underscript)).to.throw(TypeError);
      api.register('readOnlyLate', 'ok');
      expect(globalThis.underscript.readOnlyLate).to.equal('ok');
    });
  });
});
