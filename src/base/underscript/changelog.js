import showdown from 'showdown';
import axios from 'axios';
import { scriptVersion } from 'src/utils/1.variables.js';
import style from 'src/utils/style.js';
import * as menu from 'src/utils/menu.js';
import Translation from 'src/structures/constants/translation.ts';

const changelog = {};

const keys = {
  title: Translation.General('changelog'),
  text: Translation.Menu('changelog'),
  note: Translation.Menu('changelog.note'),
  loading: Translation.General('changelog.loading'),
  unavailable: Translation.General('changelog.unavailable'),
};

// Change log :O
style.add(`
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
    // TODO: get from github?
    changelog.axios = axios.create({ baseURL: 'https://unpkg.com/' });
  }
  return changelog.axios;
}

function open(message) {
  BootstrapDialog.show({
    message,
    title: `${keys.title}`,
    cssClass: 'mono us-changelog',
    buttons: [{
      label: `${Translation.CLOSE}`,
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
  const container = $('<div>').text(keys.loading);
  open(container);
  get(version, short).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    return `${keys.unavailable}`;
  }).then((m) => container.html(m));
}

// Add menu button
menu.addButton({
  text: keys.text,
  action() {
    load(scriptVersion === 'L' ? 'latest' : scriptVersion);
  },
  enabled() {
    return typeof BootstrapDialog !== 'undefined';
  },
  note() {
    if (!this.enabled()) {
      return keys.note;
    }
    return undefined;
  },
});
