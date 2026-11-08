import Translation from 'src/structures/constants/translation';
import compound from 'src/utils/compoundEvent';
import { debug } from 'src/utils/debug';
import { pluginRegistry } from 'src/utils/debugFlags';
import DialogHelper from 'src/utils/DialogHelper';
import eventManager from 'src/utils/eventManager';
import * as menu from 'src/utils/menu';
import * as registry from 'src/utils/pluginRegistry';
import style from 'src/utils/style';
import css from './plugins.css';

const keys = {
  button: Translation.Menu('plugins'),
  note: Translation.Menu('plugins.note'),
  title: Translation.General('plugins'),
  available: Translation.General('plugins.available'),
  empty: Translation.General('plugins.empty'),
  failed: Translation.General('plugins.failed'),
  install: Translation.General('plugins.install'),
  installed: Translation.General('plugins.installed'),
  latest: Translation.General('plugins.latest'),
  loading: Translation.General('loading'),
  name: Translation.General('plugins.name'),
  noMatch: Translation.General('plugins.noMatch'),
  refresh: Translation.General('refresh'),
  reinstall: Translation.General('plugins.reinstall'),
  search: Translation.General('search.plugins'),
  stale: Translation.General('plugins.stale'),
  unavailable: Translation.General('plugins.unavailable'),
  updated: Translation.General('plugins.updated'),
};

const EMPTY = '-';

style.add(css);

const STATUSES = [
  { id: 'installed', label: keys.installed },
  { id: 'stale', label: keys.stale },
  { id: 'available', label: keys.available },
];

const HIDDEN = 'underscript.registry.hidden';

function loadHidden() {
  try {
    const stored = JSON.parse(localStorage.getItem(HIDDEN));
    const ids = STATUSES.map(({ id }) => id);
    return new Set(Array.isArray(stored) ? stored.filter((id) => ids.includes(id)) : []);
  } catch (e) {
    debug(e, pluginRegistry);
    return new Set();
  }
}

const hidden = loadHidden();

function saveHidden() {
  try {
    localStorage.setItem(HIDDEN, JSON.stringify([...hidden]));
  } catch (e) {
    debug(e, pluginRegistry);
  }
}

const dialog = new DialogHelper();
let container;
let tableHolder;
let refreshed;
let complete;
let query = '';

dialog.onClose(() => {
  container = null;
  tableHolder = null;
  refreshed = false;
  complete = false;
  query = '';
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
  tableHolder = $('<div>');
  container = $('<div>').append(toolbar(), tableHolder);
  render();
  return container;
}

function toolbar() {
  const search = $('<input type="search" class="form-control plugin-search">')
    .attr('placeholder', `${keys.search}`)
    .val(query)
    .on('input', () => {
      query = search.val().trim().toLowerCase();
      render();
    });
  const filters = $('<div class="plugin-filters">').append(
    STATUSES.map(({ id, label }) => {
      const button = $('<button type="button" class="btn btn-sm">')
        .text(`${label}`)
        .on('click', () => {
          if (!hidden.delete(id)) hidden.add(id);
          saveHidden();
          button.toggleClass('btn-primary', !hidden.has(id)).toggleClass('btn-stale', hidden.has(id));
          render();
        });
      return button.toggleClass('btn-primary', !hidden.has(id)).toggleClass('btn-stale', hidden.has(id));
    }),
  );
  return $('<div class="plugin-toolbar">').append(search, filters);
}

function statusOf(name) {
  if (registry.isRunning(name)) return 'installed';
  return registry.wasSeen(name) ? 'stale' : 'available';
}

function matches({ name, author }) {
  if (hidden.has(statusOf(name))) return false;
  if (!query) return true;
  return `${name} ${author || ''}`.toLowerCase().includes(query);
}

function render() {
  if (!tableHolder) return;
  const plugins = registry.plugins();
  const visible = plugins.filter(matches);
  const body = $('<tbody>');
  if (!visible.length) {
    body.append($('<tr>').append(
      $('<td class="empty" colspan="5">').text(`${plugins.length ? keys.noMatch : emptyText()}`),
    ));
  } else {
    visible.sort(
      ({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB),
    ).forEach((entry) => body.append(row(entry)));
  }
  complete = registry.datesLoaded() && plugins.length > 0 && plugins.every(({ name }) => registry.info(name));
  tableHolder.empty().append($('<table class="table">').append(header(), body));
}

function header() {
  return $('<thead>').append($('<tr>').append(
    $('<th>').text(`${keys.name}`),
    $('<th class="version">').text(`${keys.installed}`),
    $('<th class="version">').text(`${keys.latest}`),
    $('<th class="version">').text(`${keys.updated}`),
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
      $('<td>').append(
        $('<div>').text(name),
        author && $('<small class="plugin-author">').text(author),
      ),
      $('<td class="version">').text(installed({ name, running, stale })),
      latest({ name, running, version }),
      updated(name),
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

function updated(name) {
  const time = registry.modified(name);
  return $('<td class="version">').text(time ? new Date(time).toLocaleDateString() : EMPTY);
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
