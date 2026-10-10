export const UNDERSCRIPT = 'UnderScript';
export const footer = `<div style="width:100%;text-align:center;font-size:12px;font-family:monospace;">${UNDERSCRIPT} &copy;feildmaster</div>`;
export const footer2 = `<div style="width:100%;text-align:center;font-size:12px;font-family:monospace;">via ${UNDERSCRIPT}</div>`;
/**
 * @typedef {Window & typeof globalThis & Record<string, any>} UserWindow
 */

/** @type {import('./hotkey.class').default[]} */
export const hotkeys = [];
export const scriptVersion = GM_info.script.version;
/** @type {UserWindow} */
export const window = typeof unsafeWindow === 'object' ? unsafeWindow : globalThis;
/** @type {UserWindow} */
export const script = this || window;

export const SOCKET_SCRIPT_CLOSED = 3500;

export const HOUR = 60 * 60 * 1000;

export const DAY = 24 * HOUR;

export function noop() {}
