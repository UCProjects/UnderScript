import showdown from 'showdown';
import axios from 'axios';
import { scriptVersion } from '../utils/1.variables.js';
import style from '../utils/style.js';
import * as menu from '../utils/menu.js';
import css from '../utils/css.js';

const changelog = {};

// Change log :O
style.add(css`
  .us-changelog h2 {
    font-size: 24px;
  }

  .us-changelog h3 {
    font-size: 20px;
  }

  extended {
    display: contents;
  }
`);
function getMarkdown() {
  if (!changelog.markdown) {
    changelog.markdown = new showdown.Converter({
      noHeaderId: true,
      strikethrough: true,
      disableForced4SpacesIndentedSublists: true,
    });
  }
  return changelog.markdown;
}
function getAxios() {
  if (!changelog.axios) {
    changelog.axios = axios.create({ baseURL: 'https://unpkg.com/' });
  }
  return changelog.axios;
}

function open(message) {
  BootstrapDialog.show({
    message,
    title: 'UnderScript Change Log',
    cssClass: 'mono us-changelog',
    buttons: [{
      label: 'Close',
      action(self) {
        self.close();
      },
    }],
  });
}

export function get(version = 'latest', short = false) {
  const cache = version.includes('.');
  const key = `${version}${short ? '_short' : ''}`;
  if (cache && changelog[key]) return Promise.resolve(changelog[key]);

  const extension = `underscript@${version}/changelog.md`;
  return getAxios().get(extension).then(({ data: text }) => {
    const first = text.indexOf(`\n## ${cache ? `Version ${version}` : ''}`);
    let end;
    if (!~first) throw new Error('Invalid Changelog');
    if (short) {
      const index = text.indexOf('\n## ', first + 1);
      if (index !== -1) end = index;
    }
    const parsedHTML = getMarkdown().makeHtml(text.substring(first, end).trim()).replace(/\r?\n/g, '');
    // Cache results
    if (cache) changelog[key] = parsedHTML;
    return parsedHTML;
  });
}

export function load(version = 'latest', short = false) {
  const container = $('<div>').text('Please wait');
  open(container);
  get(version, short).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    return 'Unavailable at this time';
  }).then((m) => container.html(m));
}

// Add menu button
menu.addButton({
  text: 'UnderScript Change Log',
  action() {
    load(scriptVersion === 'L' ? 'latest' : scriptVersion);
  },
  enabled() {
    return typeof BootstrapDialog !== 'undefined';
  },
  note() {
    if (!this.enabled()) {
      return 'Unavailable on this page';
    }
    return undefined;
  },
});
