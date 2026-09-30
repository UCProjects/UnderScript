import Translation from 'src/structures/constants/translation.ts';
import compound from 'src/utils/compoundEvent.js';
import DialogHelper from 'src/utils/DialogHelper.js';
import eventManager from 'src/utils/eventManager.js';
import * as menu from 'src/utils/menu.js';
import * as registry from 'src/utils/pluginRegistry.js';
import style from 'src/utils/style.js';
import css from './plugins.css';

const keys = {
  button: Translation.Menu('plugins'),
  note: Translation.Menu('plugins.note'),
  title: Translation.General('plugins'),
  author: Translation.General('plugins.author'),
  empty: Translation.General('plugins.empty'),
  failed: Translation.General('plugins.failed'),
  install: Translation.General('plugins.install'),
  installed: Translation.General('plugins.installed'),
  latest: Translation.General('plugins.latest'),
  loading: Translation.General('loading'),
  name: Translation.General('plugins.name'),
  refresh: Translation.General('refresh'),
  reinstall: Translation.General('plugins.reinstall'),
  stale: Translation.General('plugins.stale'),
  unavailable: Translation.General('plugins.unavailable'),
};

const EMPTY = '-';

style.add(css);

const dialog = new DialogHelper();
let container;
let refreshed;
let complete;

dialog.onClose(() => {
  container = null;
  refreshed = false;
  complete = false;
});

function addRefresh() {
  if (refreshed) return;
  refreshed = true;
  dialog.prependButton({
    label: `${keys.refresh}`,
    cssClass: 'btn-success',
    action() {
      location.reload();
    },
  });
}

function open() {
  dialog.open({
    title: `${keys.title}`,
    cssClass: 'underscript-dialog plugin-registry',
    message: build,
  });
  registry.refresh().then(update);
}

function update() {
  if (complete) return;
  render();
}

function build() {
  container = $('<div>');
  render();
  return container;
}

function render() {
  if (!container) return;
  const plugins = registry.plugins();
  const body = $('<tbody>');
  if (!plugins.length) {
    body.append($('<tr>').append(
      $('<td class="empty" colspan="5">').text(`${emptyText()}`),
    ));
  } else {
    plugins.sort(
      ({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB),
    ).forEach((entry) => body.append(row(entry)));
  }
  complete = plugins.length > 0 && plugins.every(({ name }) => registry.info(name));
  container.empty().append($('<table class="table">').append(header(), body));
}

function header() {
  return $('<thead>').append($('<tr>').append(
    $('<th>').text(`${keys.name}`),
    $('<th>').text(`${keys.author}`),
    $('<th class="version">').text(`${keys.installed}`),
    $('<th class="version">').text(`${keys.latest}`),
    $('<th class="action">'),
  ));
}

function emptyText() {
  switch (registry.status()) {
    case 'error': return keys.unavailable;
    case 'ready': return keys.empty;
    default: return keys.loading;
  }
}

function row({ name, author }) {
  const { version } = registry.info(name) || {};
  const running = registry.isRunning(name);
  const stale = !running && registry.wasSeen(name);
  return $('<tr>')
    .toggleClass('stale', stale)
    .append(
      $('<td>').text(name),
      $('<td>').text(author || EMPTY),
      $('<td class="version">').text(installed({ name, running, stale })),
      latest({ name, running, version }),
      $('<td class="action">').append(action({ name, running, stale })),
    );
}

function installed({ name, running, stale }) {
  if (running) return registry.runningVersion(name) || `${Translation.UNKNOWN}`;
  if (stale) return `${keys.stale}`;
  return EMPTY;
}

function latest({ name, running, version }) {
  const cell = $('<td class="version">');
  if (!version) return cell.text(EMPTY);
  const current = running && registry.runningVersion(name);
  if (current && current !== version) {
    return cell.addClass('outdated').append(
      $('<span class="glyphicon glyphicon-arrow-up">'),
      ' ',
      $('<span>').text(version),
    );
  }
  return cell.text(version);
}

function action({ name, running, stale }) {
  if (running) {
    return $('<button disabled>')
      .addClass('btn btn-sm btn-primary')
      .text(`${keys.installed}`);
  }
  const meta = registry.info(name);
  if (!meta?.url) {
    return $('<button disabled>')
      .addClass('btn btn-sm btn-stale')
      .text(`${meta ? keys.failed : keys.loading}`);
  }
  const button = $('<a>')
    .text(stale ? `${keys.reinstall}` : `${keys.install}`)
    .attr({
      href: meta.url,
      rel: 'noreferrer',
      target: 'updateUserScript',
    })
    .addClass('btn btn-sm')
    .toggleClass('btn-stale', stale)
    .toggleClass('btn-success', !stale)
    .on('click auxclick', () => {
      addRefresh();
      button.removeClass().addClass('btn btn-sm btn-primary');
    });
  return button;
}

menu.addButton({
  text: keys.button,
  action: open,
  enabled() {
    return typeof BootstrapDialog !== 'undefined';
  },
  note() {
    if (!this.enabled()) return keys.note;
    return undefined;
  },
});

compound('underscript:ready', ':load', () => {
  registry.load().then(registry.markSeen);
  registry.refresh().then(update);
});

eventManager.on(':update', () => {
  registry.refresh({ force: true }).then(update);
});
