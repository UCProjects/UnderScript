import { expect } from 'chai';
import { currentUser, loadDust, saveDust } from '../../src/structures/craft/dustStore';

const fakeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = `${value}`; },
  };
};
const brokenStorage = () => ({
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('blocked'); },
});
const MINUTE = 60 * 1000;

describe('craft dust store', () => {
  it('gives back what was saved for the same user', () => {
    const storage = fakeStorage();
    expect(saveDust(500, { user: '7', now: 1000, storage })).to.equal(true);
    expect(loadDust({ user: '7', now: 1000 + MINUTE, storage })).to.equal(500);
  });

  it('keeps only the latest value', () => {
    const storage = fakeStorage();
    saveDust(500, { user: '7', now: 1000, storage });
    saveDust(420, { user: '7', now: 2000, storage });
    expect(loadDust({ user: '7', now: 3000, storage })).to.equal(420);
  });

  it('does not hand one user the dust of another', () => {
    const storage = fakeStorage();
    saveDust(500, { user: '7', now: 1000, storage });
    expect(loadDust({ user: '8', now: 2000, storage })).to.equal(undefined);
  });

  it('does not save or load without a user', () => {
    const storage = fakeStorage();
    expect(saveDust(500, { user: null, now: 1000, storage })).to.equal(false);
    expect(storage.data).to.deep.equal({});
    saveDust(500, { user: '7', now: 1000, storage });
    expect(loadDust({ user: null, now: 2000, storage })).to.equal(undefined);
  });

  it('forgets a value after half an hour', () => {
    const storage = fakeStorage();
    saveDust(500, { user: '7', now: 0, storage });
    expect(loadDust({ user: '7', now: 30 * MINUTE, storage })).to.equal(500);
    expect(loadDust({ user: '7', now: 30 * MINUTE + 1, storage })).to.equal(undefined);
  });

  it('ignores anything it cannot read', () => {
    expect(loadDust({ user: '7', now: 0, storage: fakeStorage() })).to.equal(undefined);
    ['not json', '{}', '{"user":"7","dust":"5","at":0}', '{"user":"7","dust":5}', 'null']
      .forEach((raw) => {
        expect(loadDust({ user: '7', now: 1, storage: fakeStorage({ 'underscript.craft.dust': raw }) })).to.equal(undefined);
      });
  });

  it('copes with storage that is blocked', () => {
    expect(saveDust(500, { user: '7', now: 0, storage: brokenStorage() })).to.equal(false);
    expect(loadDust({ user: '7', now: 0, storage: brokenStorage() })).to.equal(undefined);
    expect(currentUser(brokenStorage())).to.equal(null);
  });

  it('uses the user the session recorded when none is given', () => {
    const storage = fakeStorage({ UserID: '7' });
    expect(saveDust(500, { storage })).to.equal(true);
    expect(loadDust({ storage })).to.equal(500);
    storage.setItem('UserID', '8');
    expect(loadDust({ storage })).to.equal(undefined);
  });

  it('saves nothing when the session has no user', () => {
    const storage = fakeStorage();
    expect(saveDust(500, { storage })).to.equal(false);
    expect(loadDust({ storage })).to.equal(undefined);
  });

  it('reads the user the session recorded', () => {
    expect(currentUser(fakeStorage({ UserID: '7' }))).to.equal('7');
    expect(currentUser(fakeStorage())).to.equal(null);
  });
});
