import eventManager from './eventManager';
import wrap from './2.pokemon';

type Callback = (...args: any[]) => unknown;

export default function compound(...args: [...events: string[], callback: Callback]): void {
  const callback = args.pop();
  if (typeof callback !== 'function') throw new Error('Callback not provided');
  const events = args as string[];
  const cache: Record<string, { triggered: boolean | 'singleton' }> = {};
  let triggered = 0;
  // TODO: cache data
  function trigger(this: UnderScriptEventMeta, event: string, ...data: unknown[]) {
    if (!cache[event].triggered) {
      cache[event].triggered = this.singleton ? 'singleton' : true;
      triggered += 1;
    }

    if (triggered >= events.length) {
      events.forEach((ev) => {
        const e = cache[ev];
        // Only reset if not singleton
        if (e.triggered !== true) return;
        e.triggered = false;
        triggered -= 1;
      });
      wrap(callback as Callback);
    }
  }

  events.forEach((ev) => {
    cache[ev] = {
      triggered: false,
    };
    eventManager.on(ev, function wrapper(this: UnderScriptEventMeta, ...data: unknown[]) {
      trigger.call(this, ev, ...data);
    });
  });
}
