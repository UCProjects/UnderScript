import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { assert as assertInc } from '../counter';
import eventEmitter from '../../src/utils/eventEmitter';

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('EventEmitter', () => {
  let emitter = eventEmitter();
  let warnings;
  const originalWarn = console.warn; // eslint-disable-line no-console

  beforeEach(() => {
    warnings = [];
    console.warn = (...args) => warnings.push(args.join(' ')); // eslint-disable-line no-console
  });

  afterEach(() => {
    console.warn = originalWarn; // eslint-disable-line no-console
  });

  afterEach('Reset state', () => {
    // TODO: Better way to clear events
    emitter = eventEmitter();
  });

  afterEach(() => {
    // Assert each function has asserted properly
    assertInc(0, 'Failed to assert before finishing');
  });

  describe('the instance', () => {
    it('is an object', () => {
      expect(emitter).to.be.an.instanceOf(Object);
    });

    it('is immutable', () => {
      expect(emitter).to.be.frozen;
    });

    it('has all properties', () => {
      const properties = {
        on: 'function',
        once: 'function',
        one: 'function',
        until: 'function',
        emit: 'function',
        cancelable: 'emitter',
        canceled: 'emitter',
        singleton: 'emitter',
        async: 'emitter',
      };

      Object.keys(properties).forEach((key) => {
        expect(emitter).to.have.property(key);

        const type = properties[key];
        switch (type) {
          case '': return;
          case 'emitter':
            expect(emitter[key]).to.not.equal(emitter);
            expect(emitter[key]).to.be.frozen;
            ['on', 'once', 'one', 'until', 'off', 'emit'].forEach((method) => {
              expect(emitter[key][method]).to.be.a('function');
            });
            break;
          default:
            expect(emitter[key]).to.be.a(type);
        }
      });
    });

    it('should be extendable', () => {
      const emitter2 = {
        ...emitter,
      };
      ['on', 'once', 'one', 'until'].forEach((key) => {
        expect(emitter2[key]()).to.equal(emitter2);
      });
    });
  });

  describe('flags', () => {
    it('warn that asking for them is deprecated, once each', () => {
      emitter.cancelable;
      emitter.cancelable;
      emitter.async.singleton;
      expect(warnings).to.deep.equal([
        'EventEmitter: `cancelable` is deprecated, pass `{ cancelable: true }` to emit directly.',
        'EventEmitter: `async` is deprecated, pass `{ async: true }` to emit directly.',
        'EventEmitter: `singleton` is deprecated, pass `{ singleton: true }` to emit directly.',
      ]);
    });

    it('do not warn when passed to emit', () => {
      emitter.emit({ cancelable: true, async: true, singleton: true, canceled: true }, 'test');
      expect(warnings).to.deep.equal([]);
    });

    it('stay with the emitter they were asked from', () => {
      const flagged = emitter.cancelable;
      emitter.on('test', function cancel() { this.canceled = true; });
      expect(emitter.emit('test').canceled).to.be.false;
      expect(flagged.emit('test').canceled).to.be.true;
      expect(flagged.emit('test').canceled).to.be.true;
    });

    it('are not left behind when nothing is emitted', () => {
      emitter.async;
      emitter.cancelable;
      emitter.singleton;
      emitter.on('test', function cancel() { this.canceled = true; });
      const result = emitter.emit('test');
      expect(result).to.not.be.instanceOf(Promise);
      expect(result.canceled).to.be.false;
      expect(emitter.emit('test').canceled).to.be.false;
    });

    it('add up when chained', async () => {
      emitter.on('test', function cancel() { this.canceled = true; });
      const result = emitter.async.cancelable.emit('test');
      expect(result).to.be.instanceOf(Promise);
      expect((await result).canceled).to.be.true;
    });

    it('can be given to emit instead', () => {
      emitter.on('test', function cancel() { this.canceled = true; });
      expect(emitter.emit({ cancelable: true }, 'test').canceled).to.be.true;
      expect(emitter.cancelable.emit({ cancelable: false }, 'test').canceled).to.be.false;
    });

    it('share the listeners of the emitter they came from', () => {
      emitter.cancelable.on('test', () => {
        expect().inc();
      });
      emitter.async.emit('test');
      emitter.emit('test');
      assertInc(2);
    });

    it('keep chaining from the emitter they came from', () => {
      const flagged = emitter.cancelable;
      expect(flagged.on('test', () => {})).to.equal(flagged);
      expect(flagged.once('test', () => {})).to.equal(flagged);
    });
  });

  describe('events', () => {
    describe('on', () => {
      it('should register');

      it('should register different events');

      it('should register multiple events');

      it('should be chainable');
    });

    describe('emit', () => {
      it('runs', () => {
        emitter.on('test', () => {
          expect().inc();
        });
        const res = emitter.emit('test');
        expect(res.ran).to.be.true;
        assertInc(1);
      });

      it('does not run', () => {
        const { ran } = emitter.emit('test');
        expect(ran).to.be.false;
      });

      it('runs multiple times', () => {
        emitter.on('test', () => {
          expect().inc();
        });
        // Not called yet
        assertInc(0);
        // Call twice
        const { ran: emit1 } = emitter.emit('test');
        const { ran: emit2 } = emitter.emit('test');
        expect(emit1).to.be.true;
        expect(emit2).to.be.true;
        // Should now be 2
        assertInc(2);
      });

      it('passes arguments', () => {
        const args = [1, 2, 3];
        emitter.on('test', (...rest) => {
          expect(rest).to.deep.equal(args).and.inc();
        });
        emitter.emit('test', ...args);
        assertInc(1);
      });

      it('passes an array', () => {
        const args = [1, 2, 3];
        emitter.on('test', (arg) => {
          expect(arg).to.equal(args).and.inc();
        });
        emitter.emit('test', args);
        assertInc(1);
      });
    });

    describe('cancelable', () => {
      it('should be canceled', () => {
        emitter.on('test', function cancel() {
          this.canceled = true;
          expect(this.cancelable).to.be.true.and.inc();
        });
        const { canceled } = emitter.cancelable.emit('test');
        expect(canceled).to.be.true;
        assertInc(1);
      });

      it('should not be canceled', () => {
        emitter.on('test', () => {});
        const { canceled } = emitter.cancelable.emit('test');
        expect(canceled).to.be.false;
      });

      it('should not be canceled if not cancelable', () => {
        emitter.on('test', function cancel() {
          expect(this.cancelable).to.be.false.and.inc();
          this.canceled = true;
        });
        const { canceled } = emitter.emit('test');
        expect(canceled).to.be.false;
        assertInc(1);
      });
    });

    describe('canceled', () => {
      function test() {
        expect(this.cancelable).to.be.true.and.inc();
        expect(this.canceled).to.be.true.and.inc();
      }

      it('is canceled from the start', () => {
        emitter.on('test', test);
        const { canceled } = emitter.canceled.emit('test');
        expect(canceled).to.be.true;
        assertInc(2);
      });

      it('should no longer be canceled', () => {
        emitter.on('test', function cancel() {
          test.call(this);
          this.canceled = false;
        });
        const { canceled } = emitter.canceled.emit('test');
        expect(canceled).to.be.false;
        assertInc(2);
      });

      it('is canceled even if not ran', () => {
        const { canceled } = emitter.canceled.emit('test');
        expect(canceled).to.be.true;
      });
    });

    describe('async', () => {
      it('should return a promise');

      it('should run');

      it('should be cancelable');

      it('should be canceled');

      it('should not be canceled');

      it('should be delayed');

      it('should retain the awaited value');
    });

    describe('singleton', () => {
      it('should emit once', () => {
        emitter.on('test', () => {
          expect().inc();
        });
        emitter.singleton.emit('test'); // Initial call
        emitter.singleton.emit('test'); // Try to call again
        emitter.emit('test'); // Try to call without singleton
        assertInc(1);
      });

      it('should emit on delay', (done) => {
        emitter.singleton.emit('test');
        emitter.on('test', () => {
          expect().inc();
        });
        setTimeout(() => {
          assertInc(1);
          done();
        }, 1);
      });

      it.skip('should call again if reset');
    });

    describe('emit options', () => {
      it('makes an event cancelable', () => {
        emitter.on('test', function cancel() {
          this.canceled = true;
          expect(this.cancelable).to.be.true.and.inc();
        });
        const { canceled } = emitter.emit({ cancelable: true }, 'test');
        expect(canceled).to.be.true;
        assertInc(1);
      });

      it('is not cancelable by default', () => {
        emitter.on('test', function cancel() {
          this.canceled = true;
          expect(this.cancelable).to.be.false.and.inc();
        });
        expect(emitter.emit({}, 'test').canceled).to.be.false;
        assertInc(1);
      });

      it('starts canceled', () => {
        emitter.on('test', function check() {
          expect(this.cancelable).to.be.true.and.inc();
          expect(this.canceled).to.be.true.and.inc();
        });
        expect(emitter.emit({ canceled: true }, 'test').canceled).to.be.true;
        assertInc(2);
      });

      it('passes the data after the event name', () => {
        emitter.on('test', (a, b) => {
          expect(a).to.equal(1).and.inc();
          expect(b).to.equal('two').and.inc();
        });
        emitter.emit({ cancelable: true }, 'test', 1, 'two');
        assertInc(2);
      });

      it('returns a promise when async', async () => {
        emitter.on('test', async function wait() {
          expect(this.async).to.be.true.and.inc();
          this.canceled = true;
        });
        const result = emitter.emit({ async: true, cancelable: true }, 'test');
        expect(result).to.be.an.instanceOf(Promise);
        expect(await result).to.deep.equal({ ran: true, canceled: true });
        assertInc(1);
      });

      it('emits a singleton once', () => {
        emitter.on('test', () => {
          expect().inc();
        });
        emitter.emit({ singleton: true }, 'test');
        emitter.emit({ singleton: true }, 'test');
        assertInc(1);
      });

      it('replays a singleton to late listeners', (done) => {
        emitter.emit({ singleton: true }, 'test', 'late');
        emitter.on('test', (value) => {
          expect(value).to.equal('late').and.inc();
        });
        setTimeout(() => {
          assertInc(1);
          done();
        }, 1);
      });

      it('lets false turn a chained option back off', () => {
        emitter.on('test', function cancel() {
          this.canceled = true;
          expect(this.cancelable).to.be.false.and.inc();
        });
        expect(emitter.cancelable.emit({ cancelable: false }, 'test').canceled).to.be.false;
        assertInc(1);
      });

      it('combines with chained options', async () => {
        emitter.on('test', async function cancel() {
          this.canceled = true;
          expect(this.cancelable).to.be.true.and.inc();
        });
        const result = emitter.cancelable.emit({ async: true }, 'test');
        expect(result).to.be.an.instanceOf(Promise);
        expect((await result).canceled).to.be.true;
        assertInc(1);
      });

      it('does not leak into the next emit', () => {
        emitter.on('test', function cancel() {
          this.canceled = true;
        });
        emitter.emit({ cancelable: true }, 'test');
        expect(emitter.emit('test').canceled).to.be.false;
      });

      it('works with the old form afterwards', () => {
        emitter.on('test', () => {
          expect().inc();
        });
        emitter.emit({ cancelable: true }, 'test');
        emitter.emit('test');
        assertInc(2);
      });
    });

    describe('once', () => {
      it('should be called once', () => {
        emitter.once('test', () => {
          expect().inc();
        });
        emitter.emit('test');
        emitter.emit('test');
        assertInc(1);
      });
    });

    describe('one', () => {
      it('should be called once', () => {
        emitter.one('test', () => {
          expect().inc();
        });
        emitter.emit('test');
        emitter.emit('test');
        assertInc(1);
      });
    });

    describe('until', () => {
      it('should be called thrice', () => {
        emitter.until('test', (count) => {
          expect().inc();
          return count === 3;
        });
        for (let i = 0; i < 5; i++) {
          emitter.emit('test', i + 1);
        }
        // Event is called 5 times, callback is only 3
        assertInc(3);
      });

      it('should be called thrice (async)');
    });

    describe('off', () => {
      it('should be called until turned off', () => {
        function callback() {
          expect().inc();
        }
        emitter.on('test', callback);
        emitter.emit('test');
        assertInc(1);
        emitter.off('test', callback);
        emitter.emit('test');
        assertInc(0);
      });

      it('should turn off a wrapped listener by its original function', () => {
        let calls = 0;
        function callback() {
          calls += 1;
        }
        function wrapped(...args) {
          return callback(...args);
        }
        wrapped.original = callback;
        emitter.on('test', wrapped);
        emitter.off('test', callback);
        emitter.emit('test');
        expect(calls).to.equal(0);
      });

      it('should leave unrelated listeners alone', () => {
        let calls = 0;
        emitter.on('test', () => { calls += 1; });
        emitter.off('test', () => {});
        emitter.emit('test');
        expect(calls).to.equal(1);
      });
    });
  });
  describe('Extend', () => {
    it('should override on');

    it('should still process parent emit');
  });
});
