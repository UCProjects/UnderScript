import getTextValue from 'src/utils/getTextValue';
import Setting from './text';

export default class Select extends Setting {
  constructor(name = 'select') {
    super(name);
  }

  default([data] = []) {
    if (data === undefined) return '';
    return `${getTextValue(data, { allowBlank: true }).value}`;
  }

  element(value, update, {
    data = [],
  }) {
    return $('<select>')
      .append(options(data, value))
      .on('change.script', (e) => update(e.target.value));
  }
}

function options(data = [], current = '') {
  return data.map((o) => {
    const { text, value } = getTextValue(o, { allowBlank: true });
    return `<option value="${value}"${`${current}` === `${value}` ? ' selected' : ''}>${text}</option>`;
  });
}
