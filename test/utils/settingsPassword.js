import { expect } from 'chai';
import Password from '../../src/utils/settings/types/password';

function build(value = 'secret') {
  const updates = [];
  const element = $(new Password().element(value, (v) => updates.push(v), { key: 'test.password' }));
  return { element, updates, input: element.find('input'), toggle: element.find('button') };
}

describe('password setting type', () => {
  it('starts masked with the stored value', () => {
    const { input } = build('hunter2');
    expect(input.prop('type')).to.equal('password');
    expect(input.val()).to.equal('hunter2');
  });

  it('keeps the setting id on the input so the label still points at it', () => {
    const { input } = build();
    expect(input.attr('id')).to.equal('test.password');
  });

  it('tells browsers not to fill saved logins', () => {
    const { input } = build();
    expect(input.attr('autocomplete')).to.equal('new-password');
  });

  it('shows and hides the value with the button', () => {
    const { input, toggle } = build();
    toggle.trigger('click');
    expect(input.prop('type')).to.equal('text');
    expect(toggle.hasClass('glyphicon-eye-close')).to.equal(true);
    expect(toggle.hasClass('glyphicon-eye-open')).to.equal(false);
    toggle.trigger('click');
    expect(input.prop('type')).to.equal('password');
    expect(toggle.hasClass('glyphicon-eye-open')).to.equal(true);
  });

  it('never submits a surrounding form', () => {
    const { toggle } = build();
    expect(toggle.attr('type')).to.equal('button');
  });

  it('saves what was typed when leaving the field', () => {
    const { input, updates } = build();
    input.val('changed').trigger('blur');
    expect(updates).to.deep.equal(['changed']);
  });
});
