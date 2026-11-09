import { expect } from 'chai';
import compound from '../../src/utils/compoundEvent';
import eventEmitter from '../../src/utils/eventEmitter';
import eventManager from '../../src/utils/eventManager';

describe('compoundEvent', () => {
  it('waits for every event on the global event manager', () => {
    const calls = [];
    compound('compound:a', 'compound:b', () => calls.push('done'));
    eventManager.emit('compound:a');
    expect(calls).to.deep.equal([]);
    eventManager.emit('compound:b');
    expect(calls).to.deep.equal(['done']);
  });

  it('waits for events from other emitters', () => {
    const own = eventEmitter();
    const calls = [];
    compound([own, 'one'], 'compound:c', () => calls.push('done'));
    own.emit('one');
    expect(calls).to.deep.equal([]);
    eventManager.emit('compound:c');
    expect(calls).to.deep.equal(['done']);
  });

  it('treats the same event name on two emitters as different events', () => {
    const left = eventEmitter();
    const right = eventEmitter();
    const calls = [];
    compound([left, 'same'], [right, 'same'], () => calls.push('done'));
    left.emit('same');
    expect(calls).to.deep.equal([]);
    right.emit('same');
    expect(calls).to.deep.equal(['done']);
  });

  it('keeps a singleton from another emitter, and runs again for the other event', async () => {
    const own = eventEmitter();
    const calls = [];
    own.emit({ singleton: true }, 'ready');
    compound([own, 'ready'], 'compound:d', () => calls.push('done'));
    await new Promise((resolve) => { setTimeout(resolve, 20); });
    eventManager.emit('compound:d');
    eventManager.emit('compound:d');
    expect(calls).to.deep.equal(['done', 'done']);
  });

  it('needs a callback', () => {
    expect(() => compound('compound:e')).to.throw('Callback not provided');
  });
});
