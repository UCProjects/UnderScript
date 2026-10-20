import { expect } from 'chai';
import axios from 'axios';
import eventManager from '../../../src/utils/eventManager';
import { clearToasts } from '../../setup/simpletoast';

const flush = () => new Promise((resolve) => { setImmediate(resolve); });
const until = async (check) => {
  for (let i = 0; i < 100 && !check(); i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 20); });
  }
};
const cardsOf = () => ({ action: 'getCards', type: 'pack', cards: JSON.stringify([{ id: 1, name: 'Card', rarity: 'COMMON', shiny: false }]) });

describe('quick packs', () => {
  let requests;
  let originalAdapter;
  let inline;

  const click = (selector, init = {}) => {
    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, ...init });
    document.querySelector(selector).dispatchEvent(event);
    return event;
  };
  const waiting = () => requests.filter((request) => !request.answered);
  const settleAll = async () => {
    while (waiting().length) {
      const [request] = waiting();
      request.answered = true;
      request.resolve({ status: 200, data: cardsOf(), headers: {}, config: request.config });
      // eslint-disable-next-line no-await-in-loop
      await flush();
    }
  };

  before(async () => {
    globalThis.location = window.location;
    globalThis.Element = window.Element;
    globalThis.HTMLElement = window.HTMLElement;
    window.history.pushState({}, '', '/Packs');
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => new Promise((resolve, reject) => {
      requests.push({ config, resolve, reject });
    });
    eventManager.emit({ singleton: true }, 'Deck:Loaded', { collection: '[]' });
    await import('../../../src/base/store/quickPacks');
    eventManager.emit('jQuery');
    await flush();
  });

  after(() => {
    axios.defaults.adapter = originalAdapter;
  });

  beforeEach(() => {
    requests = [];
    inline = 0;
    const holder = document.createElement('div');
    holder.id = 'holder';
    holder.innerHTML = '<span id="nbPacks">3</span><span class="nbPacksHeader">3</span><button id="btnOpen"></button>';
    document.body.append(holder);
    document.querySelector('#btnOpen').onclick = () => { inline += 1; };
  });

  afterEach(async () => {
    await settleAll();
    await flush();
    clearToasts();
    document.querySelector('#holder').remove();
  });

  it('leaves a plain click to the game', () => {
    const event = click('#btnOpen');
    expect(event.defaultPrevented).to.equal(false);
    expect(inline).to.equal(1);
    expect(requests).to.have.length(0);
  });

  it('opens every pack on a shift click, and keeps the game from opening the first one', async () => {
    const event = click('#btnOpen', { shiftKey: true });
    await until(() => requests.length >= 3);
    expect(event.defaultPrevented).to.equal(true);
    expect(inline).to.equal(0);
    expect(requests.map((request) => JSON.parse(request.config.data))).to.deep.equal([
      { action: 'openPack' },
      { action: 'openPack' },
      { action: 'openPack' },
    ]);
    await settleAll();
    await flush();
    expect(document.querySelector('#nbPacks').textContent).to.equal('0');
    expect(document.querySelector('.nbPacksHeader').textContent).to.equal('0');
  });

  it('does nothing on a shift click when there are no packs', async () => {
    document.querySelector('#nbPacks').textContent = '0';
    click('#btnOpen', { shiftKey: true });
    await flush();
    expect(requests).to.have.length(0);
    expect(globalThis.underscript.openingPacks()).to.equal(false);
  });

  it('keeps clicks from reaching the game while packs are being opened', async () => {
    click('#btnOpen', { shiftKey: true });
    await flush();
    await flush();
    expect(globalThis.underscript.openingPacks()).to.equal(true);
    const event = click('#btnOpen');
    expect(event.defaultPrevented).to.equal(true);
    expect(inline).to.equal(0);
  });

  describe('underscript.openPacks()', () => {
    it('opens no more than the player has', async () => {
      globalThis.underscript.openPacks(10);
      await flush();
      await flush();
      expect(requests).to.have.length(3);
    });

    it('does nothing when there are none', async () => {
      document.querySelector('#nbPacks').textContent = '0';
      expect(globalThis.underscript.openPacks(5)).to.equal(undefined);
      await flush();
      expect(requests).to.have.length(0);
    });

    it('throws for a type it does not know, and while packs are being opened', async () => {
      expect(() => globalThis.underscript.openPacks(1, 'Gold')).to.throw('Unsupported Pack: Gold');
      globalThis.underscript.openPacks(1);
      await flush();
      await flush();
      expect(() => globalThis.underscript.openPacks(1)).to.throw('Currently opening packs');
    });
  });
});
