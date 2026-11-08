import luxon from 'luxon';
import tippy from 'tippy.js';
import axios from 'axios';
import showdown from 'showdown';
import * as api from 'src/utils/4.api';
import VarStore from 'src/utils/VarStore';

const lib = api.mod.lib;
lib.tippy = tippy;
const warned = new VarStore(false);
Object.defineProperty(lib, 'axios', {
  enumerable: true,
  get() {
    if (!warned.value) {
      warned.value = true;
      console.warn("'underscript.lib.axios' is deprecated and will be removed, use 'fetch' instead.");
    }
    return axios;
  },
});
lib.luxon = luxon;
lib.showdown = showdown;
