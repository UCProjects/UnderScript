import { expect } from 'chai';
import eventManager from '../../src/utils/eventManager';

describe('hover notes', () => {
  const original = globalThis.$.i18n;
  const KEY = 'underscript.test.note';

  const enter = (element) => element.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }));
  const leave = (element) => element.dispatchEvent(new window.MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
  const tooltip = (root = document.body) => [...root.children].find((child) => child.style.position === 'fixed');

  let hide;

  before(async () => {
    globalThis.Element = window.Element;
    globalThis.HTMLElement = window.HTMLElement;
    ({ hide } = await import('../../src/utils/hover'));
    eventManager.emit('jQuery');
  });

  after(() => {
    delete globalThis.Element;
    delete globalThis.HTMLElement;
  });

  afterEach(() => {
    hide();
    globalThis.$.i18n = original;
    document.body.innerHTML = '';
  });

  it('shows the translation of data-us-note', () => {
    globalThis.$.i18n = (key) => (key === KEY ? 'Translated note' : key);
    document.body.innerHTML = `<span id="a" data-us-note="${KEY}">A</span>`;
    enter(document.getElementById('a'));
    expect(tooltip().textContent).to.contain('Translated note');
  });

  it('removes the note when the pointer leaves', () => {
    globalThis.$.i18n = (key) => (key === KEY ? 'Translated note' : key);
    document.body.innerHTML = `<span id="a" data-us-note="${KEY}">A</span>`;
    enter(document.getElementById('a'));
    leave(document.getElementById('a'));
    expect(tooltip()).to.equal(undefined);
  });

  it('shows data-us-note-fallback when the key is not translated', () => {
    globalThis.$.i18n = (key) => key;
    document.body.innerHTML = `<span id="a" data-us-note="${KEY}" data-us-note-fallback="Fallback note">A</span>`;
    enter(document.getElementById('a'));
    expect(tooltip().textContent).to.contain('Fallback note');
    expect(tooltip().textContent).to.not.contain(KEY);
  });

  it('prefers the translation over the fallback', () => {
    globalThis.$.i18n = (key) => (key === KEY ? 'Translated note' : key);
    document.body.innerHTML = `<span id="a" data-us-note="${KEY}" data-us-note-fallback="Fallback note">A</span>`;
    enter(document.getElementById('a'));
    expect(tooltip().textContent).to.contain('Translated note');
    expect(tooltip().textContent).to.not.contain('Fallback note');
  });

  it('shows the key when there is nothing else to show', () => {
    globalThis.$.i18n = (key) => key;
    document.body.innerHTML = `<span id="a" data-us-note="${KEY}">A</span>`;
    enter(document.getElementById('a'));
    expect(tooltip().textContent).to.contain(KEY);
  });

  it('ignores a fallback without data-us-note', () => {
    document.body.innerHTML = '<span id="a" data-us-note-fallback="Only fallback">A</span>';
    enter(document.getElementById('a'));
    expect(tooltip()).to.equal(undefined);
  });

  it('shows nothing when data-us-note is empty', () => {
    document.body.innerHTML = '<span id="a" data-us-note="" data-us-note-fallback="Ignored">A</span>';
    enter(document.getElementById('a'));
    expect(tooltip()).to.equal(undefined);
  });

  it('finds the note from a child element', () => {
    globalThis.$.i18n = (key) => key;
    document.body.innerHTML = `<span id="a" data-us-note="${KEY}" data-us-note-fallback="From parent"><b id="b">B</b></span>`;
    enter(document.getElementById('b'));
    expect(tooltip().textContent).to.contain('From parent');
  });

  it('does not use the old data-note attribute', () => {
    document.body.innerHTML = '<span id="a" data-note="Old">A</span>';
    enter(document.getElementById('a'));
    expect(tooltip()).to.equal(undefined);
  });

  it('puts the note inside an open popover so it is not hidden behind it', () => {
    globalThis.$.i18n = (key) => key;
    document.body.innerHTML = `<div id="pop" popover><span id="a" data-us-note="${KEY}" data-us-note-fallback="In popover">A</span></div>`;
    enter(document.getElementById('a'));
    expect(tooltip(document.getElementById('pop')).textContent).to.contain('In popover');
    expect(tooltip(document.body)).to.equal(undefined);
  });
});
