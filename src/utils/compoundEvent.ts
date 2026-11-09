import eventManager from './eventManager';
import wrap from './2.pokemon';
import Counter from './Counter';

type Callback = (...args: any[]) => unknown;
type Emitter = { on(event: string, listener: (this: UnderScriptEventMeta, ...args: any[]) => unknown): unknown };
type Source = string | readonly [emitter: Emitter, event: string];

export default function compound(...args: [...events: Source[], callback: Callback]): void {
  const callback = args.pop();
  if (typeof callback !== 'function') throw new Error('Callback not provided');
  const sources = (args as Source[]).map((source) => (
    typeof source === 'string' ? { emitter: eventManager as Emitter, event: source } : { emitter: source[0], event: source[1] }
  ));
  const cache = sources.map(() => ({ triggered: false as boolean | 'singleton' }));
  const triggered = new Counter();
  // TODO: cache data
  function trigger(this: UnderScriptEventMeta, index: number) {
    if (!cache[index].triggered) {
      cache[index].triggered = this.singleton ? 'singleton' : true;
      triggered.next();
    }

    if (triggered.value >= sources.length) {
      cache.forEach((entry) => {
        // Only reset if not singleton
        if (entry.triggered !== true) return;
        entry.triggered = false;
        triggered.remove();
      });
      wrap(callback as Callback);
    }
  }

  sources.forEach(({ emitter, event }, index) => {
    emitter.on(event, function wrapper(this: UnderScriptEventMeta) {
      trigger.call(this, index);
    });
  });
}
