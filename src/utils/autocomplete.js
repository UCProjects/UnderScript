import style from './style.js';
import styles from './autocomplete.css';

style.add(styles);

const sources = [];
const attached = new WeakMap();
const boundaries = ['', ' '];

export function register({
  name,
  prefix,
  options,
  render,
  insert,
  atStart = false,
  limit = 5,
}) {
  if (typeof prefix !== 'string' || !prefix) throw new Error('Autocomplete requires a prefix');
  if (typeof options !== 'function') throw new Error('Autocomplete requires options()');

  const source = {
    name, prefix, options, render, insert, atStart, limit,
  };
  sources.push(source);
  return source;
}

function valueOf(item) {
  return typeof item === 'string' ? item : item.value;
}

// FALL DOWN LOGIC: very important to not ruin
function findToken(input, prefix) {
  const text = input.value;
  if (!text.includes(prefix)) return undefined;
  const size = prefix.length;

  if (text.indexOf(' ') === -1 && text.startsWith(prefix)) {
    return { start: size, end: text.length };
  }

  const cursor = input.selectionStart;
  if (!boundaries.includes(text.substring(cursor, cursor + 1))) return undefined;

  const head = text.substring(0, cursor);
  const at = head.lastIndexOf(prefix);
  if (at === -1) return undefined;
  if (at !== 0 && !boundaries.includes(head[at - 1])) return undefined;

  // if immediate space, if more than 1 space, ignore it
  const word = head.substring(at + size);
  if (word.length && (word[0] === ' ' || word.indexOf(' ') !== word.lastIndexOf(' '))) return undefined;

  return { start: at + size, end: cursor };
}

function getToken(input) {
  let best;
  sources.forEach((source) => {
    const found = findToken(input, source.prefix);
    if (!found) return;
    if (source.atStart && found.start !== source.prefix.length) return;
    if (best && found.start <= best.start) return;
    best = { ...found, source };
  });
  if (!best) return undefined;

  const text = input.value;
  const { start, end, source } = best;
  return {
    source,
    text: text.substring(start, end),
    replace(str) {
      input.value = `${text.substring(0, start)}${str}${text.substring(end)}`;
      input.selectionStart = start + str.length;
      input.selectionEnd = input.selectionStart;
      input.focus();
    },
  };
}

export function highlight(value, text) {
  const matched = document.createElement('strong');
  matched.textContent = value.substring(0, text.length);
  const fragment = document.createDocumentFragment();
  fragment.append(matched, value.substring(text.length));
  return fragment;
}

export function attach(input, context = {}) {
  if (!input) return undefined;
  if (attached.has(input)) return attached.get(input);

  let box;
  let cells = [];
  let index = 0;

  function close() {
    cells = [];
    index = 0;
    if (!box) return;
    box.remove();
    box = undefined;
  }

  function setActive() {
    if (!cells.length) return;
    if (index >= cells.length) index = 0;
    if (index < 0) index = cells.length - 1;
    cells.forEach((cell, i) => cell.classList.toggle('autobox-active', i === index));
  }

  function show() {
    close();
    const token = getToken(input);
    if (!token) return;

    const { source, text, replace } = token;
    const items = (source.options({ ...context, input, text }) || []).slice(0, source.limit);
    if (!items.length) return;

    box = document.createElement('div');
    box.classList.add('autobox');
    items.forEach((item) => {
      const entry = document.createElement('div');
      const rendered = source.render ? source.render(item, text) : highlight(valueOf(item), text);
      if (rendered instanceof Node) {
        entry.append(rendered);
      } else {
        entry.textContent = `${rendered}`;
      }
      if (item?.hint === true) {
        entry.classList.add('autobox-hint');
      } else {
        entry.addEventListener('click', () => {
          replace(source.insert ? source.insert(item) : `${valueOf(item)} `);
          show();
        });
        cells.push(entry);
      }
      box.append(entry);
    });

    input.parentNode.append(box);
    setActive();
  }

  input.addEventListener('input', show);
  input.addEventListener('focus', show);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') return; // right (move into the token)
    if (!box) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (!cells.length) return;
    switch (e.key) {
      case 'ArrowDown':
        index += 1;
        break;
      case 'ArrowUp':
        index -= 1;
        break;
      case 'Enter':
      case 'Tab':
        cells[index].click();
        e.preventDefault();
        return;
      case 'ArrowLeft': // if moves before the prefix
        return; // TODO
      default:
        return;
    }
    setActive();
    e.preventDefault();
  });

  attached.set(input, close);
  return close;
}
