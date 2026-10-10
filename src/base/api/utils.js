import * as api from 'src/utils/4.api';
import eventEmitter from 'src/utils/eventEmitter';
import each from 'src/utils/each';
import sleep from 'src/utils/sleep';
import VarStore from 'src/utils/VarStore';
import { global, globalSet } from 'src/utils/global';
import Hotkey from 'src/utils/hotkey.class';
import { hide, show, tip } from 'src/utils/hover';
import notify from 'src/utils/notifications';
import shuffle from 'src/utils/shuffle';
import some from 'src/utils/some';
import TabManager from 'src/utils/tabbedView';
import rand from 'src/utils/rand';
import SettingType from 'src/utils/settings/types/setting';
import { translateText } from 'src/utils/translate';

const utils = api.mod.utils;

utils.each = each;
utils.eventEmitter = eventEmitter;
utils.sleep = sleep;
utils.global = global;
utils.globalSet = globalSet;
utils.Hotkey = Hotkey;
utils.hover = {
  hide,
  show,
  tip,
  new: (...args) => {
    // eslint-disable-next-line no-console
    console.error('Deprecation warning: Use `tip` instead!');
    return tip(...args);
  },
};
utils.notify = notify;
utils.shuffle = shuffle;
utils.some = some;
utils.tabManager = TabManager;
utils.translateText = translateText;
utils.VarStore = VarStore;
utils.rand = rand;
utils.SettingType = SettingType;
