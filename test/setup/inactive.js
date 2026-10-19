import { registerModule } from 'src/utils/plugin';

const off = new Set();

registerModule('testEnabled', (plugin) => {
  Object.defineProperty(plugin, 'enabled', { get: () => !off.has(plugin.name) });
});

export function switchOff(name) {
  off.add(name);
}

export function switchOn(name) {
  off.delete(name);
}
