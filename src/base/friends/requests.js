import axios from 'axios';
import eventManager from 'src/utils/eventManager.js';
import * as settings from 'src/utils/settings/index.js';
import { toast } from 'src/utils/2.toasts.js';
import each from 'src/utils/each.js';
import { noop } from 'src/utils/1.variables.js';
import Translation from 'src/structures/constants/translation.ts';

const setting = settings.register({
  name: Translation.Setting('friend.request'),
  key: 'underscript.disable.friend.notifications',
  page: 'Friends',
});
eventManager.on('Friends:requests', (friends) => {
  if (setting.value()) return;
  // id: name
  // const newRequests = [];
  each(friends, (friend, id) => {
    const key = `underscript.request.${id}`;
    if (sessionStorage.getItem(key)) return;
    const css = {
      background: 'inherit',
    }; // I need to add a way to clear all styles
    toast({
      title: Translation.Toast('friend.request'),
      text: friend,
      buttons: [{
        css,
        text: ' ',
        className: 'glyphicon glyphicon-ok green',
        onclick: post.bind(null, id),
      }, {
        css,
        text: ' ',
        className: 'glyphicon glyphicon-remove red',
        onclick: post.bind(null, id, false),
      }],
    });
    sessionStorage.setItem(key, friend);
  });
});
eventManager.on('logout', () => {
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('underscript.request.')) {
      sessionStorage.removeItem(key);
    }
  });
});

const request = {
  accept: Translation.Toast('friend.request.accept', 1),
  delete: Translation.Toast('friend.request.decline', 1),
};

function post(id, accept = true) {
  const action = accept ? 'accept' : 'delete';
  axios.get(`/Friends?${action}=${id}`).then(() => {
    const key = `underscript.request.${id}`;
    const name = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    toast(request[action].withArgs(name));
  }).catch(noop);
}
