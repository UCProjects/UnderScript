import { getSeasonMonth } from './season';

export const AUDIO = 'fishMusics';

export const IMAGES = 'fishImages';

export function isApril() {
  return getSeasonMonth() === 4;
}
