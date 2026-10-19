import { expect } from 'chai';
import 'src/base/plugin/logger';
import 'src/base/plugin/craft';
import { switchOff, switchOn } from '../../setup/inactive';
import { reportSmartDisenchant } from '../../../src/structures/craft/craft';

let counter = 0;

function setup() {
  counter += 1;
  const name = `Craft test ${counter}`;
  return { name, craft: globalThis.underscript.plugin(name).craft };
}

const run = { cards: [{ id: 1, shiny: false, quantity: 2 }], dust: 10, gained: 4, stopped: false };

describe('plugin craft', () => {
  const originalError = console.error; // eslint-disable-line no-console
  let errors;

  beforeEach(() => {
    errors = [];
    console.error = (...args) => errors.push(args); // eslint-disable-line no-console
  });

  afterEach(() => {
    console.error = originalError; // eslint-disable-line no-console
  });

  it('skips a listener while the plugin is switched off', () => {
    const { name, craft } = setup();
    let count = 0;
    craft.on('smartDisenchanted', () => { count += 1; });
    switchOff(name);
    reportSmartDisenchant(run);
    switchOn(name);
    reportSmartDisenchant(run);
    expect(count).to.equal(1);
  });

  it('delivers events to the plugin', () => {
    const { craft } = setup();
    const seen = [];
    craft.on('smartDisenchanted', (summary) => seen.push(summary));
    reportSmartDisenchant(run);
    expect(seen).to.deep.equal([run]);
  });

  it('removes a listener by the function that was passed', () => {
    const { craft } = setup();
    let count = 0;
    const listener = () => { count += 1; };
    craft.on('smartDisenchanted', listener);
    reportSmartDisenchant(run);
    craft.off('smartDisenchanted', listener);
    reportSmartDisenchant(run);
    expect(count).to.equal(1);
  });

  it('runs once listeners a single time', () => {
    const { craft } = setup();
    let count = 0;
    craft.once('smartDisenchanted', () => { count += 1; });
    reportSmartDisenchant(run);
    reportSmartDisenchant(run);
    expect(count).to.equal(1);
  });

  it('logs a failing listener under the plugin name and keeps going', () => {
    const { name, craft } = setup();
    const other = setup();
    let reached = false;
    craft.on('smartDisenchanted', () => { throw new Error('boom'); });
    other.craft.on('smartDisenchanted', () => { reached = true; });
    reportSmartDisenchant(run);
    expect(reached).to.equal(true);
    const logged = errors.find((args) => args.some((arg) => typeof arg === 'string' && arg.includes(name)));
    expect(logged, 'error logged with the plugin name').to.not.equal(undefined);
    expect(logged.some((arg) => arg instanceof Error && arg.message === 'boom')).to.equal(true);
  });

  it('refuses a listener that is not a function', () => {
    const { craft } = setup();
    expect(() => craft.on('crafted', 5)).to.throw('Must pass a function');
  });

  it('shares the dust UnderScript knows about', () => {
    const { craft } = setup();
    reportSmartDisenchant({ cards: [], dust: 42, gained: 1, stopped: false });
    expect(craft.dust).to.equal(42);
  });

  it('has the actions', () => {
    const { craft } = setup();
    expect(craft.craft).to.be.a('function');
    expect(craft.disenchant).to.be.a('function');
    expect(craft.autoDisenchant).to.be.a('function');
  });
});
