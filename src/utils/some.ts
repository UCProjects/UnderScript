import type { Nullish } from 'src/types/utility';

export default function some<T extends object>(
  o: Nullish<T>,
  f: (this: any, value: T[keyof T], key: Extract<keyof T, string>, object: T) => unknown,
  t?: unknown,
): Nullish<boolean> {
  return o && (Object.keys(o) as Array<Extract<keyof T, string>>).some((x) => f.call(t, o[x], x, o));
}
