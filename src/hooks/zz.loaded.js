import eventManager from '../utils/eventManager.js';
import { scriptVersion } from '../utils/1.variables.js';
import { getPageName } from '../utils/onPage.js';
import sleep from '../utils/sleep.js';

const page = getPageName();

function loaded() {
  if (eventManager.singleton.emit(':loaded').ran) {
    console.warn('`:loaded` event is depricated, please migrate to `:preload`.');
  }
  eventManager.singleton.emit(':preload');
  if (eventManager.singleton.emit(`:loaded:${page}`).ran) {
    console.warn(`\`:loaded:${page}\` event is depricated, please migrate to \`:preload:${page}\``);
  }
  eventManager.singleton.emit(`:preload:${page}`);
}
function done() {
  eventManager.singleton.emit(':load');
  eventManager.singleton.emit(`:load:${page}`);
}

if (location.host.includes('undercards.net')) {
  console.log(`UnderScript(v${scriptVersion}): Loaded`); // eslint-disable-line no-console
  if (document.title.includes('Undercards')) {
    register();
  }
}
function register() {
  document.addEventListener('DOMContentLoaded', loaded);
  window.addEventListener('load', () => sleep().then(done));
  const COMPLETE = document.readyState === 'complete';
  if (document.readyState === 'interactive' || COMPLETE) {
    loaded();
  }
  if (COMPLETE) {
    done();
  }
}
