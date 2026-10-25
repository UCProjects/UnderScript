import { expect } from 'chai';
import eventManager from '../../../src/utils/eventManager';

describe('Card:Statuses', () => {
  const changes = [];
  let card;

  function status(name, counter = 0) {
    return {
      name, counter, displayCounter: true, statusType: 'NEUTRAL', statusBehavior: 'UNIQUE',
    };
  }

  function update(statuses) {
    eventManager.emit('updateCard', { action: 'updateCard', card: JSON.stringify({ id: 7, statuses }) });
  }

  before(async () => {
    document.body.innerHTML = '<div id="7" class="card"></div>';
    card = $('#7');
    await import('../../../src/base/game/cardStatuses');
    eventManager.on('Card:Statuses', (...args) => changes.push(args));
  });

  beforeEach(() => {
    changes.length = 0;
    eventManager.emit('func:appendCard', { id: 7, statuses: [status('Taunt'), status('Poison', 2)] }, card);
  });

  it('ignores updates that change no status', () => {
    update([status('Taunt'), status('Poison', 2)]);
    expect(changes).to.have.length(0);
  });

  it('reports added statuses', () => {
    update([status('Taunt'), status('Poison', 2), status('Haste')]);
    expect(changes).to.have.length(1);
    const [parsed, element, { added, removed, changed }] = changes[0];
    expect(parsed.id).to.equal(7);
    expect(element.get(0)).to.equal(card.get(0));
    expect(added.map((e) => e.name)).to.deep.equal(['Haste']);
    expect(removed).to.have.length(0);
    expect(changed).to.have.length(0);
  });

  it('reports removed statuses', () => {
    update([status('Taunt')]);
    expect(changes[0][2].removed.map((e) => e.name)).to.deep.equal(['Poison']);
  });

  it('reports counter changes with the previous status', () => {
    update([status('Taunt'), status('Poison', 5)]);
    const [{ status: now, previous }] = changes[0][2].changed;
    expect(now.counter).to.equal(5);
    expect(previous.counter).to.equal(2);
  });

  it('compares against the last update, not the first card', () => {
    update([status('Taunt')]);
    update([status('Taunt')]);
    expect(changes).to.have.length(1);
  });

  it('is quiet for cards it has not seen', () => {
    document.body.innerHTML = '<div id="7"></div>';
    eventManager.emit('updateCard', { card: JSON.stringify({ id: 8, statuses: [status('Taunt')] }) });
    expect(changes).to.have.length(0);
  });
});
