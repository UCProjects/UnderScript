import axios from 'axios';
import { HOUR } from './1.variables';
import { debug } from './debug';
import { pluginRegistry } from './debugFlags';
import createParser from './parser/index';
import { getPluginNames, getVersion } from './plugin';
import VarStore from './VarStore';

const URL = 'https://raw.githubusercontent.com/UCProjects/UnderScript/refs/heads/master/plugins.json';
const META_URL = 'https://raw.githubusercontent.com/UCProjects/UnderScript/refs/heads/registry/plugins.meta.json';
const LIST = 'underscript.registry.list';
const VERSIONS = 'underscript.registry.versions';
const SEEN = 'underscript.registry.seen';
const DATES = 'underscript.registry.dates';

/**
 * @typedef {{ name: string, author?: string } & Exclude<UnderScriptPluginUpdate, string>} RegistryEntry
 */

/** @type {RegistryEntry[]} */
let list = [];
/** @type {'loading'|'ready'|'error'} */
let state = 'loading';
let loading;
let refreshing;
/** @type {VarStore<Record<string, { version: string, date: string }> | undefined>} */
const dates = new VarStore(undefined);

const versions = read(VERSIONS);
const seen = read(SEEN);

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch (e) {
    debug(e, pluginRegistry);
    return {};
  }
}

function write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    debug(e, pluginRegistry);
  }
}

function clean(data) {
  if (!Array.isArray(data)) throw new Error('Invalid registry');
  return data.filter(
    (entry) => {
      const { name, updateURL, downloadURL } = entry ?? {};
      return typeof name === 'string' && name &&
        (typeof updateURL === 'string' || typeof downloadURL === 'string');
    },
  ).map(({ name, author, updateURL, downloadURL }) => ({
    name,
    author,
    updateURL,
    downloadURL,
  }));
}

function localList() {
  if (typeof GM_getResourceText !== 'function') return undefined;
  const text = GM_getResourceText('plugins.json');
  if (!text) return undefined;
  try {
    return clean(JSON.parse(text));
  } catch (e) {
    debug(e, pluginRegistry);
    return undefined;
  }
}

async function fetchList() {
  const { data } = await axios.get(URL);
  const entries = clean(data);
  write(LIST, { time: Date.now(), plugins: entries });
  return entries;
}

export function load(force = false) {
  if (loading && !force) return loading;
  const local = localList();
  if (local) {
    list = local;
    state = 'ready';
    loading = Promise.resolve(list);
    return loading;
  }
  const cache = read(LIST);
  if (!force && Array.isArray(cache.plugins) && Date.now() - cache.time < HOUR) {
    list = cache.plugins;
    state = 'ready';
    loading = Promise.resolve(list);
    return loading;
  }
  loading = fetchList().then((entries) => {
    list = entries;
    state = 'ready';
    return list;
  }).catch((e) => {
    debug(e, pluginRegistry);
    list = Array.isArray(cache.plugins) ? cache.plugins : [];
    state = list.length ? 'ready' : 'error';
    return list;
  });
  return loading;
}

function cleanDates(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  return Object.fromEntries(Object.entries(data).filter(
    ([, value]) => typeof value?.version === 'string' && !Number.isNaN(Date.parse(value?.date)),
  ));
}

async function loadDates(force = false) {
  const cache = read(DATES);
  if (!force && cache.dates && Date.now() - cache.time < HOUR) {
    dates.value = cache.dates;
    return;
  }
  try {
    const { data } = await axios.get(META_URL);
    const fresh = cleanDates(data);
    dates.value = fresh;
    write(DATES, { time: Date.now(), dates: fresh });
  } catch (e) {
    debug(e, pluginRegistry);
    dates.value = cache.dates ?? dates.value ?? {};
  }
}

export function plugins() {
  return list;
}

export function status() {
  return state;
}

/** @returns {{ version: string, url: string, time: number } | undefined} */
export function info(name) {
  return versions[name];
}

/** @returns {number | undefined} when the latest version was published, if it is known */
export function modified(name) {
  const entry = dates.value?.[name];
  if (!entry || entry.version !== versions[name]?.version) return undefined;
  return Date.parse(entry.date);
}

export function datesLoaded() {
  return dates.isSet();
}

export function isRunning(name) {
  return getPluginNames().includes(name);
}

export function runningVersion(name) {
  return getVersion(name);
}

export function wasSeen(name) {
  return Object.hasOwn(seen, name);
}

export function markSeen() {
  const running = getPluginNames();
  const found = list.filter(({ name }) => running.includes(name));
  if (!found.length) return;
  found.forEach(({ name }) => {
    seen[name] = getVersion(name);
  });
  write(SEEN, seen);
}

async function resolve({ name, updateURL, downloadURL }) {
  const parser = createParser({ downloadURL, updateURL });
  const data = await parser.getUpdateData();
  versions[name] = {
    version: await parser.getVersion(data),
    url: await parser.getDownload(data),
    time: Date.now(),
  };
}

export function refresh({ force = false } = {}) {
  if (refreshing) return refreshing;
  refreshing = load(force).then(async (entries) => {
    const loadingDates = loadDates(force);
    const pending = force ? entries : entries.filter(({ name }) => !versions[name]);
    if (!pending.length) {
      await loadingDates;
      return;
    }
    await Promise.all([loadingDates, ...pending.map((entry) => resolve(entry).catch((e) => {
      debug(e, pluginRegistry, entry.name);
      versions[entry.name] = { time: Date.now(), error: true };
    }))]);
    write(VERSIONS, versions);
  }).finally(() => {
    refreshing = undefined;
  });
  return refreshing;
}
