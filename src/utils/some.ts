export default function some<T extends object>(
  o: T | null | undefined,
  f: (this: any, value: T[keyof T], key: Extract<keyof T, string>, object: T) => unknown,
  t?: unknown,
): boolean | null | undefined {
  return o && (Object.keys(o) as Extract<keyof T, string>[]).some((x) => f.call(t, o[x], x, o));
}
