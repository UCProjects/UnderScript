import { expect } from 'chai';
import Translation from '../../src/structures/constants/translation';
import getTextValue from '../../src/utils/getTextValue';

describe('getTextValue', () => {
  describe('strings and numbers', () => {
    it('uses the string for the label and the value', () => {
      expect(getTextValue('Always')).to.include({ label: 'Always', text: 'Always', value: 'Always' });
    });

    it('turns a number into a label and keeps it as the value', () => {
      expect(getTextValue(5)).to.include({ label: '5', text: '5', value: 5 });
    });
  });

  describe('translations', () => {
    const original = globalThis.$.i18n;
    const translation = Translation.Setting('example.option');

    afterEach(() => {
      globalThis.$.i18n = original;
    });

    it('uses a translation as the label and, without a value, its key as the value', () => {
      const result = getTextValue(translation);
      expect(result.label).to.equal(translation);
      expect(result.value).to.equal(translation.key);
    });

    it('reads a translation in an array or an object', () => {
      expect(getTextValue([translation, 'a'])).to.include({ label: translation, value: 'a' });
      expect(getTextValue({ label: translation, value: 'b' })).to.include({ label: translation, value: 'b' });
      expect(getTextValue(() => translation).label).to.equal(translation);
    });

    it('translates the text of a translation', () => {
      globalThis.$.i18n = (key) => (key === translation.key ? 'Traducido' : key);
      expect(getTextValue([translation, 'a']).text).to.equal('Traducido');
    });
  });

  describe('arrays', () => {
    it('reads [label, value]', () => {
      expect(getTextValue(['First', 'a'])).to.include({ label: 'First', value: 'a' });
    });

    it('falls back to the label for the value', () => {
      expect(getTextValue(['First'])).to.include({ label: 'First', value: 'First' });
      expect(getTextValue(['First', undefined])).to.include({ label: 'First', value: 'First' });
    });

    it('keeps a value that is falsy', () => {
      expect(getTextValue(['Off', 0]).value).to.equal(0);
      expect(getTextValue(['Off', ''])).to.include({ value: '' });
    });
  });

  describe('objects', () => {
    it('reads label and value', () => {
      expect(getTextValue({ label: 'First', value: 'a' })).to.include({ label: 'First', value: 'a' });
    });

    it('reads text and val as well', () => {
      expect(getTextValue({ text: 'First', val: 'a' })).to.include({ label: 'First', value: 'a' });
    });

    it('prefers label over text, and val over value', () => {
      expect(getTextValue({ label: 'L', text: 'T', val: 'v', value: 'w' })).to.include({ label: 'L', value: 'v' });
    });

    it('falls back to the label for the value', () => {
      expect(getTextValue({ label: 'First' })).to.include({ value: 'First' });
    });
  });

  describe('functions', () => {
    it('calls a function once for the option', () => {
      expect(getTextValue(() => 'Dynamic')).to.include({ label: 'Dynamic', value: 'Dynamic' });
      expect(getTextValue(() => ['Dynamic', 'd'])).to.include({ label: 'Dynamic', value: 'd' });
    });

    it('calls a function label inside an object or array', () => {
      expect(getTextValue({ label: () => 'Dynamic', value: 1 })).to.include({ label: 'Dynamic', value: 1 });
      expect(getTextValue([() => 'Dynamic', 2])).to.include({ label: 'Dynamic', value: 2 });
    });

    it('does not follow a function that returns a function', () => {
      expect(() => getTextValue(() => () => 'Deep')).to.throw('Unknown label');
    });
  });

  describe('blank labels', () => {
    it('are allowed when asked for', () => {
      const allow = { allowBlank: true };
      expect(getTextValue('', allow)).to.include({ label: '', text: '', value: '' });
      expect(getTextValue(['', 'none'], allow)).to.include({ label: '', value: 'none' });
      expect(getTextValue({ label: '', value: 'none' }, allow)).to.include({ label: '', value: 'none' });
      expect(getTextValue(() => '', allow)).to.include({ label: '' });
    });

    it('still need something to be a label', () => {
      const allow = { allowBlank: true };
      expect(() => getTextValue(null, allow)).to.throw('Label not provided');
      expect(() => getTextValue({}, allow)).to.throw('Label not provided');
    });
  });

  describe('invalid options', () => {
    it('needs a label', () => {
      expect(() => getTextValue({})).to.throw('Label not provided');
      expect(() => getTextValue('')).to.throw('Label not provided');
      expect(() => getTextValue(null)).to.throw('Label not provided');
      expect(() => getTextValue(undefined)).to.throw('Label not provided');
    });

    it('rejects a label that is neither text nor a number', () => {
      expect(() => getTextValue(true)).to.throw('Unknown label: boolean');
    });
  });

  describe('translating', () => {
    const original = globalThis.$.i18n;

    afterEach(() => {
      globalThis.$.i18n = original;
    });

    it('translates the text and leaves the value alone', () => {
      globalThis.$.i18n = (key) => (key === 'Always' ? 'Siempre' : key);
      expect(getTextValue('Always')).to.include({ label: 'Always', text: 'Siempre', value: 'Always' });
      expect(getTextValue(['Always', 'a'])).to.include({ text: 'Siempre', value: 'a' });
    });
  });
});
