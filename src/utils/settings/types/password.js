import Setting from './text';

export default class Password extends Setting {
  constructor(name = 'password') {
    super(name);
  }

  element(value, update, { key: id }) {
    const input = $(`<input type="password" autocomplete="off" id="${id}">`)
      .val(value)
      .on('blur.script', (e) => update(e.target.value))
      .css({
        'background-color': 'transparent',
      });
    const toggle = $('<button type="button" class="password-toggle glyphicon glyphicon-eye-open">')
      .on('click', () => {
        const reveal = input.prop('type') === 'password';
        input.prop('type', reveal ? 'text' : 'password');
        toggle
          .toggleClass('glyphicon-eye-open', !reveal)
          .toggleClass('glyphicon-eye-close', reveal);
      });
    return $('<span class="password-wrapper">').append(input, toggle);
  }

  styles() {
    return [
      '.password-wrapper { display: inline-block; }',
      '.password-wrapper .password-toggle { margin-left: 4px; padding: 0; color: inherit; background-color: transparent; border: none; }',
    ];
  }
}
