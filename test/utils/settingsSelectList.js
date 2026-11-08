import { expect } from 'chai';
import Translation from '../../src/structures/constants/translation';
import Select from '../../src/utils/settings/types/select';
import List from '../../src/utils/settings/types/list';

describe('select and list settings', () => {
  const original = globalThis.$.i18n;

  afterEach(() => {
    globalThis.$.i18n = original;
  });

  describe('select', () => {
    const data = [['First', 'a'], { label: 'Second', value: 'b' }, () => 'Third', 4, 'Fifth'];

    it('lists every kind of option', () => {
      const element = new Select().element('b', () => {}, { data });
      const options = element.find('option').toArray().map((option) => [option.value, option.textContent, option.selected]);
      expect(options).to.deep.equal([
        ['a', 'First', false],
        ['b', 'Second', true],
        ['Third', 'Third', false],
        ['4', '4', false],
        ['Fifth', 'Fifth', false],
      ]);
    });

    it('keeps the value when the text is translated', () => {
      globalThis.$.i18n = (key) => (key === 'Fifth' ? 'Quinto' : key);
      const element = new Select().element('Fifth', () => {}, { data });
      const option = element.find('option').last();
      expect(option.text()).to.equal('Quinto');
      expect(option.val()).to.equal('Fifth');
      expect(option.prop('selected')).to.equal(true);
    });

    it('lists translations as options', () => {
      const first = Translation.Setting('example.first');
      const second = Translation.Setting('example.second');
      globalThis.$.i18n = (key) => (key === first.key ? 'Primero' : key);
      const element = new Select().element(second.key, () => {}, { data: [first, [second, 'b']] });
      const options = element.find('option').toArray().map((option) => [option.value, option.textContent]);
      expect(options).to.deep.equal([[first.key, 'Primero'], ['b', second.key]]);
      expect(new Select().default([[first, 'x']])).to.equal('x');
      expect(new Select().default([first])).to.equal(first.key);
    });

    it('allows a blank option', () => {
      const element = new Select().element('', () => {}, { data: ['', ['', 'x'], { label: '', value: 'y' }, 'Real'] });
      const options = element.find('option').toArray().map((option) => [option.value, option.textContent]);
      expect(options).to.deep.equal([['', ''], ['x', ''], ['y', ''], ['Real', 'Real']]);
      expect(new Select().default([''])).to.equal('');
    });

    it('reports the value of the chosen option', () => {
      let chosen;
      const element = new Select().element('a', (value) => { chosen = value; }, { data });
      element.val('b').trigger('change');
      expect(chosen).to.equal('b');
    });

    it('defaults to the value of the first option', () => {
      expect(new Select().default([['First', 'a']])).to.equal('a');
      expect(new Select().default([{ label: 'First', value: 'a' }])).to.equal('a');
      expect(new Select().default(['Only'])).to.equal('Only');
      expect(new Select().default([3])).to.equal('3');
    });

    it('defaults to an empty string without options', () => {
      expect(new Select().default([])).to.equal('');
      expect(new Select().default()).to.equal('');
    });
  });

  describe('list', () => {
    const data = ['Alpha', { label: 'Beta', value: 'b' }, { text: 'Gamma', val: 'c' }, () => 'Delta'];

    it('stores the value of each item', () => {
      expect(new List().encode(data)).to.equal(JSON.stringify(['Alpha', 'b', 'c', 'Delta']));
    });

    it('puts the stored values back in order, with new items last', () => {
      const value = new List().value(JSON.stringify(['c', 'Alpha']), data);
      expect(value.map((item) => (typeof item === 'function' ? item() : item.label ?? item.text ?? item)))
        .to.deep.equal(['Gamma', 'Alpha', 'Beta', 'Delta']);
    });

    it('drops stored values that no item has', () => {
      const value = new List().value(JSON.stringify(['gone', 'b']), data);
      expect(value).to.have.length(4);
    });

    it('keeps an item without a value stable when the text is translated', () => {
      const items = [{ label: 'Alpha' }];
      globalThis.$.i18n = (key) => (key === 'Alpha' ? 'Alfa' : key);
      expect(new List().encode(items)).to.equal(JSON.stringify(['Alpha']));
    });

    it('shows the translated label of each item', () => {
      globalThis.$.i18n = (key) => (key === 'Alpha' ? 'Alfa' : key);
      const element = new List().element(data, () => {});
      expect(element.children().toArray().map((li) => li.innerText ?? li.textContent))
        .to.deep.equal(['Alfa', 'Beta', 'Gamma', 'Delta']);
    });
  });
});
