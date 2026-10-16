import { expect } from 'chai';
import { isAction, parseAuto, parseCard, parseRejection } from '../../src/structures/craft/result';

const nameOf = (card) => `Name ${card.id}`;
const card = (extra = {}) => JSON.stringify({ id: 5, name: 'Dog', ...extra });

describe('craft results', () => {
  describe('parseCard', () => {
    it('reads the card, the dust and the shiny the player asked for', () => {
      const result = parseCard({ card: card(), dust: 30 }, { isShiny: true }, nameOf);
      expect(result).to.deep.equal({ id: 5, name: 'Name 5', dust: 30, shiny: true });
    });

    it('reads shiny from the response when the request did not say', () => {
      expect(parseCard({ card: card(), dust: 1, shiny: true }, {}, nameOf).shiny).to.equal(true);
      expect(parseCard({ card: card(), dust: 1 }, {}, nameOf).shiny).to.equal(false);
    });

    it('falls back to the id and name the response carries', () => {
      const result = parseCard({ cardId: 9, cardName: 'Cat', dust: 2 }, {}, nameOf);
      expect(result).to.deep.equal({ id: 9, name: 'Cat', dust: 2, shiny: false });
    });

    it('gives up without a card id', () => {
      expect(parseCard({ dust: 2 }, {}, nameOf)).to.equal(undefined);
      expect(parseCard({ card: '{}', dust: 2 }, {}, nameOf)).to.equal(undefined);
      expect(parseCard(null, {}, nameOf)).to.equal(undefined);
      expect(parseCard('nope', {}, nameOf)).to.equal(undefined);
    });

    it('survives a card that is not JSON', () => {
      expect(parseCard({ card: '{', cardId: 3, dust: 2 }, {}, nameOf).id).to.equal(3);
    });
  });

  describe('parseAuto', () => {
    it('pairs each card with its shiny flag and how many you own now', () => {
      const result = parseAuto({
        dust: 80,
        cardsId: '[1,2]',
        cardsShiny: '[false,true]',
        cardsQuantity: '[3,1]',
      });
      expect(result).to.deep.equal({
        dust: 80,
        cards: [{ id: 1, shiny: false, owned: 3 }, { id: 2, shiny: true, owned: 1 }],
      });
    });

    it('gives an empty list when nothing changed', () => {
      expect(parseAuto({ dust: 5, cardsId: '[]', cardsShiny: '[]', cardsQuantity: '[]' }).cards).to.deep.equal([]);
    });

    it('gives up on a response without the lists', () => {
      expect(parseAuto({ dust: 5 })).to.equal(undefined);
      expect(parseAuto(undefined)).to.equal(undefined);
    });
  });

  describe('parseRejection', () => {
    it('translates the message the server sent', () => {
      const result = parseRejection('craft', { status: 'errorMaintenance', message: 'key' }, (m) => `Translated ${m}`);
      expect(result).to.deep.equal({ action: 'craft', message: 'Translated key', status: 'errorMaintenance' });
    });

    it('keeps the message when translating fails or says nothing', () => {
      const broken = () => { throw new Error('no'); };
      expect(parseRejection('auto', { message: 'key' }, broken).message).to.equal('key');
      expect(parseRejection('auto', { message: 'key' }, () => undefined).message).to.equal('key');
    });

    it('copes with a response that has no message or status', () => {
      expect(parseRejection('disenchant', {}, (m) => m)).to.deep.equal({
        action: 'disenchant',
        message: '',
        status: 'error',
      });
      expect(parseRejection('disenchant', undefined, (m) => m).status).to.equal('error');
    });
  });

  describe('isAction', () => {
    it('knows the three actions', () => {
      expect(['craft', 'disenchant', 'auto'].every(isAction)).to.equal(true);
      expect(isAction('buy')).to.equal(false);
      expect(isAction(undefined)).to.equal(false);
    });
  });
});
