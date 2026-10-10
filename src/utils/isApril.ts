import { getSeasonMonth } from './season';

export const AUDIO = 'fishMusics';

export const IMAGES = 'fishImages';

export function isApril(): boolean {
  return getSeasonMonth() === 4;
}
