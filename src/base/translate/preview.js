wrap(() => {
  if (!onPage('Translate')) return;
  eventManager.on(':loaded', () => {
    loadLanguages();

    globalSet('createTranslator', newTranslator);

    eventManager.on('ShowPage', newShowPage);
  });

  function newTranslator(translator) {
    return `<div id="preview"></div>${this.super(translator)}`;
  }

  function newShowPage(page) {
    this.super(page);

    const textarea = $('#translators textarea');
    const preview = $('#preview');
    textarea.on('input', () => {
      const text = textarea.val().trim();
      preview.html(text ? `${getPreview('decks-preview')}: ${getPreview(text)}` : '');
    });
  }

  function getPreview(id, locale = getLocale()) {
    return fn.toLocale({
      locale,
      id,
      data: [1],
    });
  }

  function getLocale() {
    return document.querySelector('#selectLanguage').value.toLowerCase();
  }

  function loadLanguages() {
    const languages = {};
    const version = global('translateVersion');
    $('#selectLanguage option').each(function languageOption() {
      const lang = this.value.toLowerCase();
      languages[lang] = `/translation/${lang}.json?v=${version}`;
    });
    $.i18n().load(languages);
  }
});
