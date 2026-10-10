export default function isSimpleObject(obj: unknown): boolean {
  return !!obj && Object.getPrototypeOf(obj) === Object.prototype;
}
