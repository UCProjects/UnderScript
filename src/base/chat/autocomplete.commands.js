import { register, highlight } from 'src/utils/autocomplete.js';
import { list } from 'src/utils/chatCommands.js';

function note(text) {
  const element = document.createElement('span');
  element.classList.add('autobox-note');
  element.textContent = text;
  return element;
}

register({
  name: 'commands',
  prefix: '/',
  atStart: true,
  options({ text }) {
    const space = text.indexOf(' ');
    if (space !== -1) {
      const entry = list().find(({ command }) => command === text.substring(0, space));
      if (!entry || !entry.usage) return [];
      return [{ hint: true, entry }];
    }
    const query = text.toLowerCase();
    return list()
      .filter(({ command }) => command.toLowerCase().startsWith(query))
      .map((entry) => ({ value: entry.command, entry }));
  },
  render(item, text) {
    const { entry } = item;
    const element = document.createDocumentFragment();
    if (item.hint) {
      element.append(`/${entry.command} `, note(entry.usage));
      return element;
    }
    element.append(highlight(item.value, text));
    const description = entry.description ? `${entry.description}` : '';
    if (description) element.append(' ', note(description));
    return element;
  },
});
