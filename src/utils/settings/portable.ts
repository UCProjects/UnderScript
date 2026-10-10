const ALWAYS_PREFIXES = ['underscript.notice.', 'underscript.plugin.'];

type PortableSetting = {
  key: string;
  extraPrefix?: string;
  exportable: boolean;
};

export function createFilter(settings: readonly PortableSetting[]): (key: string) => boolean {
  const keys = new Set<string>();
  const excluded = new Set<string>();
  const prefixes = [...ALWAYS_PREFIXES];
  settings.forEach(({ key, extraPrefix, exportable }) => {
    if (!exportable) {
      excluded.add(key);
      return;
    }
    keys.add(key);
    if (extraPrefix) prefixes.push(extraPrefix);
  });
  return (key) => !excluded.has(key) && (keys.has(key) || prefixes.some((prefix) => key.startsWith(prefix)));
}

export function serialize(storage: Storage, accepts: (key: string) => boolean): string {
  const data: Record<string, string | null> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i) as string;
    if (accepts(key)) data[key] = storage.getItem(key);
  }
  return Object.keys(data).length ? JSON.stringify(data, null, 2) : '';
}

export function parse(
  string: string,
  accepts: (key: string) => boolean,
): { accepted: Record<string, string>; skipped: string[] } {
  const data = JSON.parse(string);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid settings data');
  const accepted: Record<string, string> = {};
  const skipped: string[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string' && accepts(key)) {
      accepted[key] = value;
    } else {
      skipped.push(key);
    }
  });
  return { accepted, skipped };
}
