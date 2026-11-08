import { expect } from 'chai';
import * as api from '../../../src/utils/4.api';

describe('underscript.lib', () => {
  const original = console.warn;
  let warnings;

  before(async () => {
    globalThis.Element ??= window.Element;
    await import('../../../src/base/api/libraries');
  });

  beforeEach(() => {
    warnings = [];
    console.warn = (...args) => warnings.push(args.join(' '));
  });

  afterEach(() => {
    console.warn = original;
  });

  it('does not warn for the other libraries', () => {
    const { lib } = api.mod;
    expect([lib.tippy, lib.luxon, lib.showdown].every(Boolean)).to.equal(true);
    expect(warnings).to.have.length(0);
  });

  it('gives axios and warns once that it is deprecated', () => {
    const { lib } = api.mod;
    const first = lib.axios;
    const second = lib.axios;
    expect(first).to.equal(second);
    expect(first.get).to.be.a('function');
    expect(warnings).to.have.length(1);
    expect(warnings[0]).to.contain('underscript.lib.axios');
    expect(warnings[0]).to.contain('fetch');
  });
});
