import * as api from './4.api';

export const BUTTON = Object.freeze({
  Left: 0,
  Middle: 1,
  Right: 2,
  Back: 3,
  Forward: 4,
});

export function getName(button: number): string {
  const names = Object.keys(BUTTON) as Array<keyof typeof BUTTON>;
  return names.find((key) => BUTTON[key] === button) || 'Unknown';
}

api.mod.utils.mouse = BUTTON;
