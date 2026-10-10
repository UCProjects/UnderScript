type LocaleOptions = {
  locale?: string;
  id: unknown;
  data?: string[];
};

export default function toLocale({
  locale = 'en',
  id,
  data = [],
}: LocaleOptions): string {
  const l = $.i18n().locale;
  $.i18n().locale = locale;
  try {
    return $.i18n(`${id}`, ...data);
  } catch {
    return 'ERROR';
  } finally {
    $.i18n().locale = l;
  }
}

export function toEnglish(id: unknown, ...data: string[]): string {
  return toLocale({ id, data });
}
