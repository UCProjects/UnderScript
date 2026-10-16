import { register, highlight } from 'src/utils/autocomplete';
import { list } from 'src/utils/chatCommands';

function note(text, ...classes) {
  const element = document.createElement('span');
  element.classList.add('autobox-note', ...classes);
  element.textContent = text;
  return element;
}

function icon(address) {
  const element = document.createElement('img');
  element.classList.add('autobox-icon');
  element.alt = '';
  element.src = address;
  return element;
}

function tied(entries, entry) {
  const name = entry.command.toLowerCase();
  return entries.filter(({ command }) => command.toLowerCase() === name).length > 1;
}

register({
  name: 'commands',
  prefix: '/',
  atStart: true,
  options({ text }) {
    const entries = list();
    const space = text.indexOf(' ');
    if (space !== -1) {
      const typed = text.substring(0, space);
      const entry = entries.find(({ command, qualified }) => command === typed || qualified === typed);
      if (!entry || !entry.usage) return [];
      return [{ hint: true, entry }];
    }
    const query = text.toLowerCase();
    const qualify = query.includes(':');
    return entries
      .filter(({ command, qualified }) => (qualify ? qualified : command).toLowerCase().startsWith(query))
      .map((entry) => ({
        value: qualify ? entry.qualified : entry.command,
        completion: qualify || tied(entries, entry) ? entry.qualified : entry.command,
        entry,
      }));
  },
  insert: ({ completion }) => `${completion} `,
  render(item, text) {
    const { entry } = item;
    const element = document.createDocumentFragment();
    if (item.hint) {
      element.append(`/${entry.command} `, note(entry.usage));
      return element;
    }
    const name = document.createElement('span');
    name.append(highlight(item.value, text));
    const description = entry.description ? `${entry.description}` : '';
    if (description) name.append(' ', note(description));
    const row = document.createElement('span');
    row.classList.add('autobox-command');
    if (entry.icon) row.append(icon(entry.icon));
    row.append(name, note(entry.owner, 'autobox-owner'));
    return row;
  },
});
