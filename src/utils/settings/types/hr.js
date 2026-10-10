import Setting from './setting';

export default class HR extends Setting {
  constructor() {
    super('hr');
  }

  element() {
    return $(document.createElement('hr'))
      .addClass('separator');
  }

  labelFirst() {
    return null;
  }

  styles() {
    return [
      'hr.separator { margin: 0; width: 100%; }',
    ];
  }
}
