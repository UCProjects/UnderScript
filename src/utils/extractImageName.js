import extendLangParser from './extendLangParser.js';

let extract = false;

export default function extractImageName(mode = false) {
  extract = mode;
}

extendLangParser({
  image(nodes) {
    const [img, name, width = 64, height = 16, card = 0] = nodes;
    if (!img || !name) return '';
    if (extract) {
      return name;
    }
    const mouseOver = card ? `onmouseover="displayCardHelp(this, ${card});" onmouseleave="removeCardHover();" ` : '';
    return `<div><img style="width: ${width}px; height: ${height}px;" class="inserted-img" ${mouseOver}src="/images/inserted/${img}.png" alt="${name}"/></div>`;
  },
});
