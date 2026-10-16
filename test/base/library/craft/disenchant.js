import { expect } from 'chai';
import axios from 'axios';
import eventManager from '../../../../src/utils/eventManager';
import craftEvents from '../../../../src/structures/craft/craft';
import installClock from '../../../setup/clock';
import { clearToasts } from '../../../setup/simpletoast';

const flush = () => new Promise((resolve) => { setImmediate(resolve); });

function card(id, quantity, extra = {}) {
  return { id, name: `Card ${id}`, rarity: 'COMMON', shiny: false, quantity, ...extra };
}

describe('Smart Disenchant', () => {
  let clock;
  let shown;
  let requests;
  let quantities;
  let refreshed;
  let dust;
  let originalAdapter;
  let runs;
  const onRun = (run) => runs.push(run);

  const answer = async (request, { status = 200, data, headers = {} }) => {
    request.done = true;
    if (status >= 400) {
      request.reject(Object.assign(new Error(`Request failed ${status}`), {
        response: { status, headers, data },
      }));
    } else {
      request.resolve({ status, data, headers, config: request.config });
    }
    await flush();
  };
  const success = (request) => {
    const { idCard } = JSON.parse(request.config.data);
    dust += 5;
    return answer(request, {
      data: {
        status: 'success',
        dust,
        totalDisenchant: 1,
        DTFragments: 0,
        card: JSON.stringify({ id: idCard }),
      },
    });
  };
  const open = () => requests.filter((request) => !request.done);

  function openDialog() {
    $('#dust').nextAll('button').first().trigger('click');
    const confirm = $('<button>');
    shown.onshown({ getButton: () => confirm, getModal: () => $('<div>') });
    return { message: $(shown.message), confirm };
  }

  async function disenchantEverything() {
    const { message } = openDialog();
    message.find('fieldset.checkFixed > legend input[type="checkbox"]').each((_, box) => {
      $(box).prop('checked', true).trigger('change');
    });
    shown.buttons[0].action({ close() {} });
    await flush();
  }

  before(async () => {
    globalThis.location = window.location;
    globalThis.Element = window.Element;
    globalThis.HTMLElement = window.HTMLElement;
    window.history.pushState({}, '', '/Crafting');
    localStorage.setItem('underscript.disable.disenchant', 'false');
    globalThis.BootstrapDialog = {
      defaultOptions: {},
      show(options) {
        shown = options;
        return {};
      },
    };
    globalThis.updateQuantity = (data, change) => quantities.push([data.id, change]);
    globalThis.applyFilters = () => {};
    globalThis.showPage = () => { refreshed += 1; };
    globalThis.currentPage = 0;
    originalAdapter = axios.defaults.adapter;
    axios.defaults.adapter = (config) => new Promise((resolve, reject) => {
      requests.push({ config, resolve, reject });
    });
    await import('../../../../src/base/library/craft/disenchant');
    craftEvents.on('smartDisenchanted', onRun);
  });

  after(() => {
    craftEvents.off('smartDisenchanted', onRun);
    axios.defaults.adapter = originalAdapter;
    localStorage.removeItem('underscript.disable.disenchant');
    ['location', 'Element', 'HTMLElement', 'BootstrapDialog', 'updateQuantity', 'applyFilters', 'showPage', 'currentPage']
      .forEach((key) => delete globalThis[key]);
  });

  beforeEach(() => {
    clock = installClock();
    requests = [];
    runs = [];
    quantities = [];
    refreshed = 0;
    dust = 100;
    document.body.innerHTML = `
      <span id="dust">100</span><span id="totalDisenchant">0</span>
      <span id="nbDTFragments">0</span><button id="btnCraftDT"></button><div id="DTFragmentsDiv"></div>`;
    globalThis.collection = [card(1, 4), card(2, 3), card(3, 5)];
    eventManager.emit('jQuery');
  });

  afterEach(async () => {
    const stop = document.querySelector('.simpletoast-button');
    if (stop) stop.click();
    for (let i = 0; i < 100 && open().length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await success(open()[0]);
    }
    clock.tick(10000);
    await flush();
    clock.restore();
    clearToasts();
  });

  it('sends one request per copy, five at a time', async () => {
    await disenchantEverything();
    expect(open()).to.have.length(5);
    expect(requests.map((r) => JSON.parse(r.config.data).action)).to.deep.equal(Array(5).fill('disenchant'));
    await success(open()[0]);
    expect(requests).to.have.length(6);
    expect(open()).to.have.length(5);
  });

  it('asks for the card and finish it was told to', async () => {
    globalThis.collection = [card(7, 1, { shiny: true })];
    eventManager.emit('jQuery');
    await disenchantEverything();
    expect(JSON.parse(requests[0].config.data)).to.deep.equal({ action: 'disenchant', idCard: 7, isShiny: true });
  });

  it('updates the page for every card it disenchants and refreshes once at the end', async () => {
    await disenchantEverything();
    while (open().length) {
      // eslint-disable-next-line no-await-in-loop
      await success(open()[0]);
    }
    await flush();
    expect(quantities).to.have.length(12);
    expect(quantities.every(([, change]) => change === -1)).to.equal(true);
    expect($('#dust').text()).to.equal('160');
    expect(refreshed).to.equal(1);
    expect(document.body.textContent).to.contain('Finished disenchanting');
    expect(document.body.textContent).to.contain('+60 dust');
  });

  it('reports everything it disenchanted in one event at the end', async () => {
    await disenchantEverything();
    while (open().length) {
      // eslint-disable-next-line no-await-in-loop
      await success(open()[0]);
    }
    await flush();
    expect(runs).to.have.length(1);
    expect(runs[0].cards).to.deep.equal([
      { id: 1, shiny: false, quantity: 4 },
      { id: 2, shiny: false, quantity: 3 },
      { id: 3, shiny: false, quantity: 5 },
    ]);
    expect(runs[0].dust).to.equal(160);
    expect(runs[0].gained).to.equal(60);
    expect(runs[0].stopped).to.equal(false);
  });

  it('keeps shiny and normal copies of a card apart in the event', async () => {
    globalThis.collection = [card(1, 2), card(1, 1, { shiny: true })];
    eventManager.emit('jQuery');
    await disenchantEverything();
    while (open().length) {
      // eslint-disable-next-line no-await-in-loop
      await success(open()[0]);
    }
    await flush();
    expect(runs[0].cards).to.deep.equal([
      { id: 1, shiny: false, quantity: 2 },
      { id: 1, shiny: true, quantity: 1 },
    ]);
  });

  it('reports what was disenchanted when it is stopped', async () => {
    globalThis.collection = [card(1, 10)];
    eventManager.emit('jQuery');
    await disenchantEverything();
    await success(open()[0]);
    document.querySelector('.simpletoast-button').click();
    while (open().length) {
      // eslint-disable-next-line no-await-in-loop
      await success(open()[0]);
    }
    await flush();
    expect(runs).to.have.length(1);
    expect(runs[0].stopped).to.equal(true);
    expect(runs[0].cards).to.deep.equal([{ id: 1, shiny: false, quantity: 6 }]);
  });

  it('reports nothing when no card was disenchanted', async () => {
    globalThis.collection = [card(1, 1)];
    eventManager.emit('jQuery');
    await disenchantEverything();
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await flush();
      // eslint-disable-next-line no-await-in-loop
      if (open().length) await answer(open()[0], { status: 500, data: '' });
    }
    await flush();
    expect(runs).to.have.length(0);
  });

  it('waits out a rate limit and then carries on with the same cards', async () => {
    await disenchantEverything();
    const first = open();
    await answer(first[0], { status: 429, headers: { 'retry-after': '7' } });
    await Promise.all(first.slice(1).map((request) => success(request)));
    const sent = requests.length;
    clock.tick(6000);
    await flush();
    expect(requests).to.have.length(sent);
    expect(document.body.textContent).to.contain('Rate limited, resuming in');
    clock.tick(1000);
    await flush();
    expect(requests.length).to.be.greaterThan(sent);
    while (open().length) {
      // eslint-disable-next-line no-await-in-loop
      await success(open()[0]);
    }
    await flush();
    expect(quantities).to.have.length(12);
    expect(document.body.textContent).to.contain('Finished disenchanting');
  });

  it('keeps the page right for what went through when a request fails for good', async () => {
    globalThis.collection = [card(1, 2)];
    eventManager.emit('jQuery');
    await disenchantEverything();
    await success(open()[0]);
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await flush();
      // eslint-disable-next-line no-await-in-loop
      if (open().length) await answer(open()[0], { status: 500, data: '' });
    }
    await flush();
    expect(quantities).to.have.length(1);
    expect(refreshed).to.equal(1);
    expect(document.body.textContent).to.contain('1 failed');
  });

  describe('with debugging.craft turned on', () => {
    let logged;
    let original;

    beforeEach(() => {
      logged = [];
      original = console.debug;
      console.debug = (...args) => logged.push(args);
      localStorage.setItem('debugging.craft', '1');
    });

    afterEach(() => {
      console.debug = original;
      localStorage.removeItem('debugging.craft');
    });

    it('logs each response with its status, the request and the rate limit headers', async () => {
      globalThis.collection = [card(1, 1)];
      eventManager.emit('jQuery');
      await disenchantEverything();
      await answer(open()[0], { status: 429, headers: { 'retry-after': '7' } });
      const entry = logged.find(([label, message]) => label === '[debugging.craft]' && message === 'CraftConfig 429');
      expect(entry, 'a CraftConfig 429 line').to.not.equal(undefined);
      expect(entry[1]).to.equal('CraftConfig 429');
      expect(entry[2]).to.deep.equal({ action: 'disenchant', idCard: 1, isShiny: false });
      expect(entry[3]).to.deep.equal({ 'retry-after': '7' });
    });

    it('says nothing when the flag is off', async () => {
      localStorage.removeItem('debugging.craft');
      globalThis.collection = [card(1, 1)];
      eventManager.emit('jQuery');
      await disenchantEverything();
      await answer(open()[0], { status: 429, headers: { 'retry-after': '7' } });
      expect(logged.filter(([label]) => label === '[debugging.craft]')).to.have.length(0);
    });
  });

  it('counts a card the game would not disenchant as skipped, without trying it again', async () => {
    globalThis.collection = [card(1, 1)];
    eventManager.emit('jQuery');
    await disenchantEverything();
    await answer(open()[0], { data: { status: 'error', message: 'nope' } });
    await flush();
    expect(requests).to.have.length(1);
    expect(quantities).to.have.length(0);
    expect(document.body.textContent).to.contain('1 skipped');
  });

  it('stops when Stop is pressed and reports what was done', async () => {
    await disenchantEverything();
    await success(open()[0]);
    document.querySelector('.simpletoast-button').click();
    const sent = requests.length;
    await Promise.all(open().map((request) => success(request)));
    await flush();
    expect(requests).to.have.length(sent);
    expect(document.body.textContent).to.contain('Stopped disenchanting');
    expect(document.body.textContent).to.contain('6 of 12 cards');
  });
});
