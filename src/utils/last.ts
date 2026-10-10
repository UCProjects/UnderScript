export default function last<T>(arrayLike: ArrayLike<T>): T | undefined {
  if (Array.isArray(arrayLike)) return arrayLike.at(-1);
  if (arrayLike?.length !== undefined) return arrayLike[arrayLike.length - 1];
  throw new Error('Not an array like object');
}
