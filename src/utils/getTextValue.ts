import Translation from 'src/structures/constants/translation';
import { translateText } from './translate';

type Label = string | number | Translation | (() => TextValueOption);

export type TextValueOption =
  | Label
  | readonly [label: Label, value?: unknown]
  | { readonly label?: Label; readonly text?: Label; readonly val?: unknown; readonly value?: unknown };

export type TextValue = {
  label: string | Translation;
  text: string;
  value: unknown;
};

type Resolved = { label: string | Translation; value: unknown };

type Options = { allowBlank?: boolean };

function pick(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined);
}

function resolve(option: unknown, callable: boolean, blank: boolean): Resolved {
  if (typeof option === 'function') {
    if (!callable) throw new Error('Unknown label: function');
    return resolve(option(), false, blank);
  }
  if (Array.isArray(option)) {
    const [label, value] = option;
    const found = resolve(label, callable, blank);
    return { label: found.label, value: pick(value, found.value) };
  }
  if (option instanceof Translation) return { label: option, value: option.key };
  if (option && typeof option === 'object') {
    const { label, text, val, value } = option as Record<string, unknown>;
    const found = resolve(blank ? label ?? text : label || text, callable, blank);
    return { label: found.label, value: pick(val, value, found.value) };
  }
  if (typeof option === 'number') return { label: `${option}`, value: option };
  if (!option && !(blank && option === '')) throw new Error('Label not provided');
  if (typeof option !== 'string') throw new Error(`Unknown label: ${typeof option}`);
  return { label: option, value: option };
}

export default function getTextValue(option: TextValueOption, { allowBlank = false }: Options = {}): TextValue {
  const { label, value } = resolve(option, true, allowBlank);
  return { label, text: translateText(label), value };
}
