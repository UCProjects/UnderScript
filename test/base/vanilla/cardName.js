import { expect } from 'chai';
import eventManager from '../../../src/utils/eventManager';

const SETTING = 'underscript.standardized.cardname';

describe('English card names', () => {
  const messages = {
    'card-name-2': 'Froggit',
    'card-name-891': '<span><img class="inserted-img" src="/images/inserted/Grand_Prize.png" alt="Grand Prize"/></span>',
  };
  const instance = { locale: 'fr' };
  let original;
  let originalI18n;

  function render(fixedId) {
    return $(globalThis.createCard({ fixedId })).find('.cardName');
  }

  before(async () => {
    globalThis.Element = window.Element;
    globalThis.HTMLElement = window.HTMLElement;
    originalI18n = $.i18n;
    $.i18n = (key) => (key === undefined ? instance : messages[key]);
    original = (card) => `<div class="card"><div class="cardName">${card.fixedId} (translated)</div></div>`;
    globalThis.createCard = original;
    await import('../../../src/base/vanilla/cardName');
    eventManager.emit(':preload');
  });

  after(() => {
    delete globalThis.Element;
    delete globalThis.HTMLElement;
    $.i18n = originalI18n;
    delete globalThis.createCard;
    localStorage.removeItem(SETTING);
  });

  beforeEach(() => {
    instance.locale = 'fr';
    localStorage.setItem(SETTING, 'true');
  });

  it('replaces the name with the English one', () => {
    expect(render(2).text()).to.equal('Froggit');
  });

  it('shows a name made of an image as the image, not as markup', () => {
    const name = render(891);
    expect(name.find('img').length).to.equal(1);
    expect(name.find('img').attr('alt')).to.equal('Grand Prize');
    expect(name.text()).to.equal('');
  });

  it('leaves the card alone when the setting is off', () => {
    localStorage.removeItem(SETTING);
    expect(render(2).text()).to.equal('2 (translated)');
  });

  it('leaves the card alone when the game is already in English', () => {
    instance.locale = 'en';
    expect(render(2).text()).to.equal('2 (translated)');
  });

  it('puts the language back after looking up the name', () => {
    render(2);
    expect(instance.locale).to.equal('fr');
  });
});
