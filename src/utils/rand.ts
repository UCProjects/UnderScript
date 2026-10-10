export default (max: number, min = 0, inclusive = false): number => (
  Math.floor(Math.random() * (max - min + (inclusive ? 1 : 0))) + min
);
