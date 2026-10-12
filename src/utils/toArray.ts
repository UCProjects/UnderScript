export default function toArray<T>(value: T | ReadonlyArray<T> = []): T[] {
  return (Array.isArray(value) ? value : [value]) as T[];
}
