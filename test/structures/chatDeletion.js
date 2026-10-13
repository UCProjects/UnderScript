import { expect } from 'chai';
import parseDeletion from '../../src/structures/chat/deletion';

describe('parseDeletion', () => {
  it('reads the user the game sends as a JSON string', () => {
    expect(parseDeletion({ action: 'deleteMessages', idUser: '42' })).to.deep.equal({ userId: 42 });
  });

  it('keeps a number as it is', () => {
    expect(parseDeletion({ action: 'deleteMessages', idUser: 42 })).to.deep.equal({ userId: 42 });
  });

  it('keeps an id that is not JSON as the string it is', () => {
    expect(parseDeletion({ action: 'deleteMessages', idUser: 'abc' })).to.deep.equal({ userId: 'abc' });
  });

  it('ignores other actions', () => {
    expect(parseDeletion({ action: 'getMessage', idUser: '42' })).to.equal(undefined);
  });

  it('ignores a frame without a user', () => {
    expect(parseDeletion({ action: 'deleteMessages' })).to.equal(undefined);
    expect(parseDeletion({ action: 'deleteMessages', idUser: '' })).to.equal(undefined);
    expect(parseDeletion({ action: 'deleteMessages', idUser: '{}' })).to.equal(undefined);
  });

  it('ignores something that is not a frame', () => {
    expect(parseDeletion(null)).to.equal(undefined);
    expect(parseDeletion('deleteMessages')).to.equal(undefined);
  });
});
