import eventManager from 'src/utils/eventManager';
import { scriptVersion, window } from 'src/utils/1.variables';
import { getPageName } from 'src/utils/onPage';
import sleep from 'src/utils/sleep';

const page = getPageName();

function loaded() {
  if (eventManager.emit({ singleton: true }, ':loaded').ran) {
    console.warn('`:loaded` event is depricated, please migrate to `:preload`.');
  }
  eventManager.emit({ singleton: true }, ':preload');
  if (eventManager.emit({ singleton: true }, `:loaded:${page}`).ran) {
    console.warn(`\`:loaded:${page}\` event is depricated, please migrate to \`:preload:${page}\``);
  }
  eventManager.emit({ singleton: true }, `:preload:${page}`);
}
function done() {
  eventManager.emit({ singleton: true }, ':load');
  eventManager.emit({ singleton: true }, `:load:${page}`);
}

if (!location.host.includes('feildmaster')) {
  console.log(`UnderScript(v${scriptVersion}): Loaded`); // eslint-disable-line no-console
  if (document.contentType === 'text/html' && !document.title.includes('Just a moment')) {
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
