export default function clone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as T;
  }
  if (typeof obj === 'object') {
    return { ...obj } as T;
  }
  return obj;
}
