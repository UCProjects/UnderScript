const divisions = [
  'COPPER_III',
  'COPPER_II',
  'COPPER_I',
  'IRON_III',
  'IRON_II',
  'IRON_I',
  'GOLD_III',
  'GOLD_II',
  'GOLD_I',
  'EMERALD_III',
  'EMERALD_II',
  'EMERALD_I',
  'DIAMOND_III',
  'DIAMOND_II',
  'DIAMOND_I',
  'MASTER',
];

const first = 1100;
const width = 30;
const master = divisions.indexOf('MASTER');

function startOf(index) {
  return first + index * width;
}

export default function progress(division, elo) {
  const index = divisions.indexOf(division);
  if (index < 0 || index >= master || typeof elo !== 'number') return undefined;
  const from = startOf(index);
  const to = startOf(index + 1);
  return {
    from,
    to,
    max: to - from,
    value: Math.max(0, Math.min(elo - from, to - from)),
  };
}
