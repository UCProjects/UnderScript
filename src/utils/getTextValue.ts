import { translateText } from './translate';

type Label = string | number | (() => TextValueOption);

export type TextValueOption =
  | Label
  | readonly [label: Label, value?: unknown]
  | { readonly label?: Label; readonly text?: Label; readonly val?: unknown; readonly value?: unknown };

export type TextValue = {
  label: string;
  text: string;
  value: unknown;
};

type Resolved = { label: string; value: unknown };

function pick(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined);
}

function resolve(option: unknown, callable: boolean): Resolved {
  if (typeof option === 'function') {
    if (!callable) throw new Error('Unknown label: function');
    return resolve(option(), false);
  }
  if (Array.isArray(option)) {
    const [label, value] = option;
    const found = resolve(label, callable);
    return { label: found.label, value: pick(value, found.value) };
  }
  if (option && typeof option === 'object') {
    const { label, text, val, value } = option as Record<string, unknown>;
    const found = resolve(label || text, callable);
    return { label: found.label, value: pick(val, value, found.value) };
  }
  if (typeof option === 'number') return { label: `${option}`, value: option };
  if (!option) throw new Error('Label not provided');
  if (typeof option !== 'string') throw new Error(`Unknown label: ${typeof option}`);
  return { label: option, value: option };
}

export default function getTextValue(option: TextValueOption): TextValue {
  const { label, value } = resolve(option, true);
  return { label, text: translateText(label), value };
}
