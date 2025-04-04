import Setting from './map.js';
import SettingType from './setting.js';
import { getSettingType, isSettingType } from '../settingRegistry.js';

const mapTypes = new Set();
let baseRegistered = false;

export default class AdvancedMap extends Setting {
  /**
   * @type {SettingType}
   */
  #keyType;
  /**
   * @type {SettingType}
   */
  #valueType;
  #name;

  constructor(keyType = 'text', valueType = keyType) {
    super('advancedMap');
    this.#keyType = getSettingType(keyType);
    this.#valueType = getSettingType(valueType);
    if (!isSettingType(this.#keyType) || !isSettingType(this.#valueType)) throw new Error('AdvancedMap requires setting types');
    const uniqueTypes = [...new Set([this.#keyType, this.#valueType])];
    // const invalidTypes = uniqueTypes.filter((type) => !type.isBasic);
    // if (invalidTypes.length) throw new Error(`AdvancedMap can only use basic setting types. (invalid: ${invalidTypes.join(', ')})`);
    this.#name = uniqueTypes.join('_').replaceAll(' ', '-');
    if (baseRegistered) {
      this.name += `_${this.#name}`;
    }
  }

  /**
   * @param {Map<any, any>} val
   */
  element(val, update, {
    container, data: { keyData, valueData, leftData, rightData } = {}, disabled, key, name, untilClose,
  } = {}) {
    // TODO: validate that disabled propagates properly
    const data = [...val.entries()];
    let entries = data.length;
    const add = (lineValue, id) => {
      function save(remove) {
        if (remove) data.splice(data.indexOf(lineValue), 1);
        const ret = data.filter(([_]) => _);
        update(ret);
      }
      const line = $('<div class="item">');
      const options = { container: $('<div>'), name, disabled, remove: false, removeSetting() {}, key: `${key}.${id}`, child: true };
      const dataKey = keyData || leftData;
      const left = $(this.#keyType.element(this.#keyValue(lineValue[0], dataKey), (newValue) => {
        // TODO: validate this is how it's supposed to work
        const isInvalid = newValue !== lineValue[0] && data.some(([keyValue]) => keyValue === newValue);
        line.toggleClass('error', isInvalid);
        if (isInvalid || newValue === lineValue[0]) return;
        lineValue[0] = newValue;
        save();
      }, {
        ...options,
        data: dataKey,
      }));
      const dataValue = valueData || rightData;
      const right = $(this.#valueType.element(this.#value(lineValue[1], dataValue), (newValue) => {
        if (newValue === lineValue[1]) return;
        lineValue[1] = newValue;
        save();
      }, {
        ...options,
        data: dataValue,
      }));
      const button = $('<button class="btn btn-danger glyphicon glyphicon-trash">').on('click', () => {
        save(true);
        line.remove();
      });
      const warning = $('<div class="warning clickable">')
        .text('Duplicate value, not updated! Click here to reset.')
        .on('click', () => left.val(this.#keyValue(lineValue[0], dataKey))
          .parent().removeClass('error'));
      function refresh() {
        left.prop('disabled', disabled);
        right.prop('disabled', disabled);
        button.prop('disabled', disabled);
      }
      refresh();
      untilClose(`refresh:${key}`, refresh, `create:${key}`);
      container.append(line.append(left, ' : ', right, button, warning));
    };
    data.forEach(add);
    return $('<button class="btn btn-success glyphicon glyphicon-plus">').on('click', () => {
      const item = [
        this.#keyType.default(keyData) ?? '',
        this.#valueType.default(valueData) ?? '',
      ];
      data.push(item);
      add(item, entries);
      entries += 1;
    });
  }

  encode(value = []) {
    if (value instanceof Map) {
      return super.encode(this.#encodeEntries([...value.entries()]));
    }
    return super.encode(this.#encodeEntries(value));
  }

  styles() {
    return [...new Set([
      ...super.styles(),
      ...this.#keyType.styles(),
      ...this.#valueType.styles(),
    ]).values()];
  }

  #keyValue(value, data) {
    return this.#keyType.value(value, data);
  }

  #value(value, data) {
    return this.#valueType.value(value, data);
  }

  #encodeEntries(data = []) {
    return data.map(([key, val]) => ([
      this.#keyType.encode(key),
      this.#valueType.encode(val),
    ]));
  }

  get isRegistered() {
    const registered = mapTypes.has(this.#name);
    if (!registered) {
      mapTypes.add(this.#name);
      baseRegistered = true;
    }
    return registered;
  }
}
