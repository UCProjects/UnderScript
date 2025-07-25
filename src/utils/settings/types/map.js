import Translation from 'src/structures/constants/translation.js';
import Setting from './array.js';

export default class MapList extends Setting {
  constructor(name = 'map') {
    super(name);
  }

  default() {
    return new Map();
  }

  /**
   * @param {Map<string, string>} val
   */
  element(val, update, { container, key: setting }) {
    const data = [...val.entries()];
    function invalid(text) {
      return data.some(([value]) => value === text);
    }
    function add(value, i) {
      function save(remove) {
        if (remove) data.splice(data.indexOf(value), 1);
        update(data.filter(([key]) => key));
      }
      container.append(createItem({ value, save, invalid, key: `${setting}.${i}` }));
    }
    data.forEach(add);
    let entries = data.length;
    return $('<button class="btn btn-success glyphicon glyphicon-plus">').on('click', () => {
      const item = ['', ''];
      data.push(item);
      add(item, entries);
      entries += 1;
    });
  }

  encode(value = []) {
    if (value instanceof Map) {
      return super.encode([...value.entries()]);
    }
    return super.encode(value);
  }

  styles() {
    return [
      '{ border-top: 1px solid white; border-bottom: 1px solid white; padding: 5px 0; }',
      'label { align-self: flex-end; }',
      '.btn { padding: 3px 6px; }',
      '.item { display: inline-flex; flex-wrap: wrap; align-items: center; padding-top: 5px; width: 100%; }',
      '.item > * { margin: 0 5px; }',
      '.error [id]:not([id$=".value"]) { border-color: red; }',
      '.warning { display: none; color: red; flex-basis: 100%; user-select: none; }',
      '.error .warning { display: block; }',
    ];
  }

  value(value) {
    return new Map(super.value(value));
  }
}

function createItem({
  value = ['key', 'value'],
  save,
  invalid,
  key,
}) {
  const left = $('<input type="text">').val(value[0]).on('blur', () => {
    const newVal = left.val();
    const isInvalid = newVal !== value[0] && invalid(newVal);
    left.parent().toggleClass('error', isInvalid);
    if (isInvalid || newVal === value[0]) return;
    value[0] = newVal;
    save();
  }).attr('id', key);
  const right = $('<input type="text">').val(value[1]).on('blur', () => {
    const newVal = right.val();
    if (newVal === value[1]) return;
    value[1] = newVal;
    save();
  }).attr('id', `${key}.value`);
  const button = $('<button class="btn btn-danger glyphicon glyphicon-trash">').on('click', () => {
    save(true);
    button.parent().remove();
  });
  const warning = $('<div class="warning clickable">')
    .text(Translation.Setting('map.duplicate'))
    .on('click', () => left.val(value[0])
      .parent().removeClass('error'));
  return $('<div class="item">').append(left, ' : ', right, button, warning);
}
