export default function sleep(ms?: number): Promise<void>;
export default function sleep<T>(ms: number, value: T, ...rest: unknown[]): Promise<T>;
export default function sleep(ms = 0, ...args: unknown[]) {
  return new Promise((res) => { setTimeout(res, ms, ...args); });
}
