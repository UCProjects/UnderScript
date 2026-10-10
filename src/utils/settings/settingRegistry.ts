import SettingType from './types/setting';

export const registry = new Map<string, SettingType>();

export function getSettingType(type: unknown): SettingType | undefined {
  if (isSettingType(type)) return type;
  return registry.get(type as string);
}

export function isSettingType(type: unknown): type is SettingType {
  return type instanceof SettingType;
}

export default registry;
