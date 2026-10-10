import type { Nullish } from 'src/types/utility';
import each from './each';
import isSimpleObject from './isSimpleObject';

type Bag = Record<string, unknown>;

export default function merge(...obj: unknown[]): Bag {
  const ret: Bag = {};
  obj.forEach((o) => {
    each(o as Nullish<Bag>, (val, key) => {
      // TODO: How to handle arrays?
      ret[key] = isSimpleObject(val) ? merge(ret[key], val) : val;
    });
  });
  return ret;
}
