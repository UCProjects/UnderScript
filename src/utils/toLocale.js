fn.toLocale = ({
  locale = 'en',
  id,
  data = [],
}) => {
  const l = $.i18n().locale;
  $.i18n().locale = locale;
  let text;
  try {
    text = $.i18n(id, ...data);
  } catch (_) {
    text = 'ERROR';
  }
  $.i18n().locale = l;
  return text;
};
