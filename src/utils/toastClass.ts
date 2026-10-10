import type { Nullish } from 'src/types/utility';
import toArray from './toArray';

type ClassName = string | string[];
type ClassNames = { toast?: ClassName } & Record<string, unknown>;

export default function addToastClass(
  className: Nullish<ClassName | ClassNames>,
  name: string,
): string[] | ClassNames {
  if (className && typeof className === 'object' && !Array.isArray(className)) {
    return { ...className, toast: [name, ...toArray(className.toast)] };
  }
  return [name, ...toArray((className as Nullish<ClassName>) ?? undefined)];
}
