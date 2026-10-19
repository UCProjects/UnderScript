import { showIn } from 'src/utils/hover';
import Translation from 'src/structures/constants/translation';
import { ProfileButton, register } from '../index';
import { getNote, setNote } from '../notes';
import isSelf from './self';

function tint(element, note) {
  element.querySelector('.us-profile-icon')?.classList.toggle('yellow', note !== '');
}

function attachPreview(element, user) {
  const container = element.closest('#underscript-profile');
  const show = (event) => {
    const note = getNote(user.id);
    if (note === '' && event.type === 'mouseenter') return;
    const text = document.createElement('div');
    text.className = 'us-profile-note-preview';
    text.textContent = note;
    showIn(container, text)(event);
  };
  element.addEventListener('mouseenter', show);
  element.addEventListener('mouseleave', show);
}

function edit(element, user) {
  const action = element.querySelector('button');
  const field = document.createElement('textarea');
  field.className = 'us-profile-note-field';
  field.rows = 4;
  field.placeholder = `${Translation.General('note.placeholder', 'Notes about this user')}`;
  field.value = getNote(user.id);
  let done = false;

  function finish(save) {
    if (done) return;
    done = true;
    if (save) {
      setNote(user.id, field.value);
      tint(element, getNote(user.id));
    }
    field.remove();
    action.hidden = false;
  }

  field.addEventListener('blur', () => finish(true));
  field.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finish(false);
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      finish(true);
    }
  });
  action.hidden = true;
  element.append(field);
  field.focus();
}

class Note extends ProfileButton {
  constructor() {
    super('note', { weight: 90 });
  }

  create(user) {
    return !isSelf(user);
  }

  getLink(user, element) {
    return () => {
      edit(element, user);
      return false;
    };
  }

  getIcon(user) {
    return getNote(user.id) === '' ? 'glyphicon-pencil' : 'glyphicon-pencil yellow';
  }

  getText() {
    return `${Translation.General('note', 'Note')}`;
  }

  onMount(element, user) {
    attachPreview(element, user);
  }
}

register(new Note());
