import Translation from 'src/structures/constants/translation.js';
import { translateText } from 'src/utils/translate.js';

export default function createSearch(showSetting, settingReg) {
  const wrapper = $('<div class="setting-search">');
  const input = $('<input type="text" class="setting-search-input">')
    .attr('placeholder', translateText(Translation.Setting('search')));
  const results = $('<ul class="setting-search-results">').hide();
  wrapper.append(input, results);

  let items = [];
  let activeIndex = -1;

  function close() {
    results.hide().empty();
    items = [];
    activeIndex = -1;
  }

  function highlight(index) {
    results.children().removeClass('active');
    activeIndex = index;
    if (items[index]) results.children().eq(index).addClass('active');
  }

  function select(index) {
    const match = items[index];
    if (!match) return;
    showSetting(match.key, true);
    input.val('');
    close();
  }

  function pageLabel(page) {
    return page.name || page;
  }

  function search(query) {
    if (!query) return close();
    const q = query.toLowerCase();
    items = Object.values(settingReg)
      .filter((setting) => !setting.hidden && setting.name.toLowerCase().includes(q))
      .slice(0, 10);

    results.empty();
    if (!items.length) return close();

    items.forEach((setting, index) => {
      $('<li>')
        .append($('<span class="setting-search-name">').text(setting.name))
        .append($('<span class="setting-search-page">').text(pageLabel(setting.page)))
        .on('mousedown', (e) => {
          e.preventDefault(); // fires before input's blur, so the click isn't lost
          select(index);
        })
        .appendTo(results);
    });
    results.show();
    highlight(0);
    return undefined;
  }

  input.on('input', () => search(input.val()));

  input.on('keydown', (e) => {
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlight((activeIndex + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlight((activeIndex - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(activeIndex);
    } else if (e.key === 'Escape') {
      close();
    }
  });

  input.on('blur', () => setTimeout(close, 100));

  return {
    el: wrapper,
    reset: () => { input.val(''); close(); },
  };
}
