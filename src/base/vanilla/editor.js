import eventManager from 'src/utils/eventManager';
import addMenuButton from 'src/utils/menubuttons';
import addFooterLink from 'src/utils/footerlinks';

const url = 'https://undercard.feildmaster.com';
const icon = './images/cardBacks/BASECardDETERMINATION.png';

eventManager.on('jQuery', () => {
  addFooterLink(
    $('[data-i18n="[html]footer-wiki"]'),
    `<a href="${url}" target="_blank" rel="noreferrer"><img alt="Card Editor" src="${icon}" style="height: 16px;"> <span>Card Editor</span></a>`,
  );
});
eventManager.on(':load', () => {
  const img = `<img src="${icon}" style="height: 16px;">`;
  addMenuButton(`${img} Card Editor`, url);
});
