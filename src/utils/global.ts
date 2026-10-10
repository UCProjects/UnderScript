import { window } from './1.variables';
import { debug } from './debug';
import hasOwn from './hasOwn';

type GlobalOptions = {
  throws?: boolean;
};

type GlobalSetOptions = {
  force?: boolean;
  throws?: boolean;
};

const target = window;

export function global(...keys: [string, ...string[]]): any;
export function global(...args: [...keys: [string, ...string[]], options: GlobalOptions]): any;
export function global(...args: (string | GlobalOptions)[]): any {
  const {
    throws = true,
  } = typeof args[args.length - 1] === 'object' ? args.pop() as GlobalOptions : {};
  const key = args as string[];
  const found = key.find((e) => hasOwn(window, e));
  if (found === undefined) {
    const msg = `[${key.join(',')}] does not exist`;
    if (throws) throw new Error(msg);
    return debug(msg);
  }
  return target[found];
}

export function globalSet(
  key: string,
  value: unknown,
  { force = false, throws = true }: GlobalSetOptions = {},
): any {
  if (!force && !hasOwn(window, key)) {
    const msg = `[${key}] does not exist`;
    if (throws) throw new Error(msg);
    return debug(msg);
  }
  const original = target[key];
  if (typeof value === 'function') {
    const wrapper = {
      super: original,
    };
    target[key] = value.bind(wrapper);
  } else {
    target[key] = value;
  }
  return original;
}
