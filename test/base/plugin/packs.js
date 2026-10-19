import { expect } from 'chai';
import axios from 'axios';
import 'src/base/plugin/logger';
import 'src/base/plugin/packs';
import { switchOff, switchOn } from '../../setup/inactive';

let counter = 0;

const cleanup = [];

function setup() {
  counter += 1;
  const name = `Packs test ${counter}`;
  const { packs } = globalThis.underscript.plugin(name);
  const track = (listener) => {
    cleanup.push(() => packs.off('bought', listener));
    return listener;
  };
  return { name, packs, track };
}

const flush = () => new Promise((resolve) => { setImmediate(resolve); });

describe('plugin packs', () => {
  const originalError = console.error; // eslint-disable-line no-console
  let originalAdapter;
  let errors;

  async function buyOne(packs) {
    const pending = packs.buy(1);
    await flush();
    await flush();
    return pending;
  }

  before(() => {
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => Promise.resolve({
      status: 200,
      data: { action: 'getPackAdded', type: 'pack' },
      headers: {},
      config,
    });
  });

  after(() => {
    axios.defaults.adapter = originalAdapter;
  });

  beforeEach(() => {
    errors = [];
    console.error = (...args) => errors.push(args); // eslint-disable-line no-console
  });

  afterEach(() => {
    cleanup.splice(0).forEach((remove) => remove());
    console.error = originalError; // eslint-disable-line no-console
  });

  it('delivers events to the plugin', async () => {
    const { packs, track } = setup();
    const seen = [];
    packs.on('bought', track((result) => seen.push(result)));
    await buyOne(packs);
    expect(seen).to.have.length(1);
    expect(seen[0]).to.include({ count: 1, requested: 1, gold: true });
  });

  it('skips a listener while the plugin is switched off', async () => {
    const { name, packs, track } = setup();
    let count = 0;
    packs.on('bought', track(() => { count += 1; }));
    switchOff(name);
    await buyOne(packs);
    switchOn(name);
    await buyOne(packs);
    expect(count).to.equal(1);
  });

  it('lets a listener cancel the result being shown', async () => {
    const { packs, track } = setup();
    let canceled;
    packs.on('bought', track(function cancel() { this.canceled = true; }));
    packs.on('bought', track(function after() { canceled = this.canceled; }));
    await buyOne(packs);
    expect(canceled).to.equal(true);
  });

  it('removes a listener by the function that was passed', async () => {
    const { packs } = setup();
    let count = 0;
    const listener = () => { count += 1; };
    packs.on('bought', listener);
    await buyOne(packs);
    packs.off('bought', listener);
    await buyOne(packs);
    expect(count).to.equal(1);
  });

  it('runs once listeners a single time', async () => {
    const { packs } = setup();
    let count = 0;
    packs.once('bought', () => { count += 1; });
    await buyOne(packs);
    await buyOne(packs);
    expect(count).to.equal(1);
  });

  it('logs a failing listener under the plugin name and keeps going', async () => {
    const { name, packs, track } = setup();
    const other = setup();
    let reached = false;
    packs.on('bought', track(() => { throw new Error('boom'); }));
    other.packs.on('bought', other.track(() => { reached = true; }));
    await buyOne(packs);
    expect(reached).to.equal(true);
    const logged = errors.find((args) => args.some((arg) => typeof arg === 'string' && arg.includes(name)));
    expect(logged, 'error logged with the plugin name').to.not.equal(undefined);
    expect(logged.some((arg) => arg instanceof Error && arg.message === 'boom')).to.equal(true);
  });

  it('refuses a listener that is not a function', () => {
    const { packs } = setup();
    expect(() => packs.on('bought', 5)).to.throw('Must pass a function');
  });

  it('reports whether packs are being bought or opened', async () => {
    const { packs } = setup();
    expect(packs.buying).to.equal(false);
    expect(packs.opening).to.equal(false);
  });
});
