export default function isTrue(val: unknown): boolean {
  return val === true || val === 'true' || val === 1 || val === '1';
}
