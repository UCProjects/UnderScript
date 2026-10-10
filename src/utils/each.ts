export default function each<T extends object>(
  o: T | null | undefined,
  f: (this: any, value: T[keyof T], key: Extract<keyof T, string>, object: T) => void,
  t?: unknown,
): void {
  if (!o) return;
  (Object.keys(o) as Extract<keyof T, string>[]).forEach((x) => {
    f.call(t, o[x], x, o);
  });
}
