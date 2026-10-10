import type { Nullish } from 'src/types/utility';

export default function length(obj: unknown): number {
  if (obj instanceof Map) {
    return obj.size;
  }
  if (typeof (obj as Nullish<{ length?: unknown }>)?.length === 'number') {
    return (obj as { length: number }).length;
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).length;
  }
  throw new Error(`Unable to find length of ${JSON.stringify(obj)}`);
}
