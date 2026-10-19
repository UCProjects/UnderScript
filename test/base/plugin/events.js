import { expect } from 'chai';
import eventManager from 'src/utils/eventManager';
import 'src/base/plugin/events';
import { switchOff, switchOn } from '../../setup/inactive';

let counter = 0;

function setup() {
  counter += 1;
  const { events } = globalThis.underscript.plugin(`Events test ${counter}`);
  return { events, event: `test:${counter}` };
}

describe('plugin events', () => {
  it('skips a listener while the plugin is switched off', () => {
    const { events, event } = setup();
    const name = `Events test ${counter}`;
    let calls = 0;
    events.on(event, () => { calls += 1; });
    events.emit(event);
    switchOff(name);
    events.emit(event);
    events.emit(event);
    switchOn(name);
    events.emit(event);
    expect(calls).to.equal(2);
  });

  it('keeps a once listener for when the plugin is switched back on', () => {
    const { events, event } = setup();
    const name = `Events test ${counter}`;
    let calls = 0;
    events.once(event, () => { calls += 1; });
    switchOff(name);
    events.emit(event);
    expect(calls).to.equal(0);
    switchOn(name);
    events.emit(event);
    events.emit(event);
    expect(calls).to.equal(1);
  });

  it('does not count a skipped call towards until', () => {
    const { events, event } = setup();
    const name = `Events test ${counter}`;
    let calls = 0;
    events.until(event, () => {
      calls += 1;
      return true;
    });
    switchOff(name);
    events.emit(event);
    expect(calls).to.equal(0);
    switchOn(name);
    events.emit(event);
    events.emit(event);
    expect(calls).to.equal(1);
  });

  it('does not emit while the plugin is switched off', () => {
    const { events, event } = setup();
    const name = `Events test ${counter}`;
    const { events: other } = setup();
    let calls = 0;
    other.on(event, () => { calls += 1; });
    expect(events.emit(event)).to.deep.equal({ ran: true, canceled: false });
    switchOff(name);
    expect(events.emit(event)).to.deep.equal({ ran: false, canceled: false });
    expect(events.emit.cancelable(event)).to.deep.equal({ ran: false, canceled: false });
    expect(events.emit({ cancelable: true }, event)).to.deep.equal({ ran: false, canceled: false });
    switchOn(name);
    expect(calls).to.equal(1);
  });

  it('answers like an emit nobody listens to while the plugin is switched off', () => {
    const { events, event } = setup();
    const name = `Events test ${counter}`;
    expect(events.emit({ canceled: true }, `${event}:plain`)).to.deep.equal({ ran: false, canceled: true });
    switchOff(name);
    expect(events.emit({ canceled: true }, event)).to.deep.equal({ ran: false, canceled: true });
    expect(events.emit.canceled(event)).to.deep.equal({ ran: false, canceled: true });
    switchOn(name);
  });

  it('gives a promise for an async emit while the plugin is switched off', async () => {
    const { events, event } = setup();
    switchOff(`Events test ${counter}`);
    const result = events.emit.async(event);
    expect(result).to.be.instanceOf(Promise);
    expect(await result).to.deep.equal({ ran: false, canceled: false });
    expect(await events.emit({ async: true }, event)).to.deep.equal({ ran: false, canceled: false });
    switchOn(`Events test ${counter}`);
  });

  it('does not leave flags behind for the next emit', () => {
    const { events, event } = setup();
    const { events: other } = setup();
    switchOff(`Events test ${counter - 1}`);
    events.emit.async.cancelable(event);
    const result = other.emit(event);
    expect(result).to.not.be.instanceOf(Promise);
    expect(result.canceled).to.equal(false);
    switchOn(`Events test ${counter - 1}`);
  });

  it('keeps the flags of a chain for every call made through it', () => {
    const { events, event } = setup();
    const chain = events.emit.cancelable;
    events.on(event, function cancel() { this.canceled = true; });
    expect(chain(event).canceled).to.equal(true);
    expect(chain(event).canceled).to.equal(true);
    expect(events.emit(event).canceled).to.equal(false);
  });

  it('leaves a cancelable event alone while the plugin is switched off', () => {
    const { events, event } = setup();
    const name = `Events test ${counter}`;
    events.on(event, function cancel() { this.canceled = true; });
    switchOff(name);
    expect(events.emit.cancelable(event).canceled).to.equal(false);
    switchOn(name);
    expect(events.emit.cancelable(event).canceled).to.equal(true);
  });

  it('calls a listener for every emit', () => {
    const { events, event } = setup();
    let calls = 0;
    events.on(event, () => { calls += 1; });
    events.emit(event);
    events.emit(event);
    expect(calls).to.equal(2);
  });

  it('passes the arguments and the meta to the listener', () => {
    const { events, event } = setup();
    let seen;
    events.on(event, function listener(...args) {
      seen = { args, meta: this.event };
    });
    events.emit(event, 1, 'two');
    expect(seen).to.deep.equal({ args: [1, 'two'], meta: event });
  });

  it('only runs once for once', () => {
    const { events, event } = setup();
    let calls = 0;
    events.once(event, () => { calls += 1; });
    events.emit(event);
    events.emit(event);
    expect(calls).to.equal(1);
  });

  it('only runs once for one', () => {
    const { events, event } = setup();
    let calls = 0;
    events.one(event, () => { calls += 1; });
    events.emit(event);
    events.emit(event);
    expect(calls).to.equal(1);
  });

  it('keeps running until the listener returns true', () => {
    const { events, event } = setup();
    let calls = 0;
    events.until(event, () => {
      calls += 1;
      return calls === 2;
    });
    [1, 2, 3, 4].forEach(() => events.emit(event));
    expect(calls).to.equal(2);
  });

  it('removes a listener with off', () => {
    const { events, event } = setup();
    let calls = 0;
    function listener() {
      calls += 1;
    }
    events.on(event, listener);
    events.emit(event);
    events.off(event, listener);
    events.emit(event);
    expect(calls).to.equal(1);
  });

  it('gives back the plugin events from off', () => {
    const { events, event } = setup();
    expect(events.off(event, () => {})).to.equal(events);
  });

  it('removes a listener from every event with off', () => {
    const { events, event } = setup();
    let calls = 0;
    function listener() {
      calls += 1;
    }
    events.on(`${event} ${event}:other`, listener);
    events.off(`${event} ${event}:other`, listener);
    events.emit(event);
    events.emit(`${event}:other`);
    expect(calls).to.equal(0);
  });

  it('only removes the listener passed to off', () => {
    const { events, event } = setup();
    const calls = [];
    function first() {
      calls.push('first');
    }
    function second() {
      calls.push('second');
    }
    events.on(event, first);
    events.on(event, second);
    events.off(event, first);
    events.emit(event);
    expect(calls).to.deep.equal(['second']);
  });

  it('does not stop other listeners when one throws', () => {
    const { events, event } = setup();
    const errors = [];
    const log = console.error;
    console.error = (...args) => errors.push(args);
    try {
      let reached = false;
      events.on(event, () => { throw new Error('broken'); });
      events.on(event, () => { reached = true; });
      events.emit(event);
      expect(reached).to.equal(true);
      expect(errors).to.have.length.greaterThan(0);
    } finally {
      console.error = log;
    }
  });

  it('shares events with the event manager', () => {
    const { events, event } = setup();
    let calls = 0;
    events.on(event, () => { calls += 1; });
    eventManager.emit(event);
    expect(calls).to.equal(1);
  });

  it('supports the cancelable flag', () => {
    const { events, event } = setup();
    events.on(event, function listener() {
      this.canceled = true;
    });
    expect(events.emit.cancelable(event).canceled).to.equal(true);
    expect(events.emit(event).canceled).to.equal(false);
  });

  it('resolves async emits to the result', async () => {
    const { events, event } = setup();
    events.on(event, async () => {});
    const result = await events.emit.async(event);
    expect(result).to.deep.equal({ ran: true, canceled: false });
  });
});
