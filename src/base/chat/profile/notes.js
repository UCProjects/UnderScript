const key = 'underscript.notes';

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function getNote(id) {
  const note = read()[`${id}`];
  return typeof note === 'string' ? note : '';
}

export function setNote(id, text) {
  const notes = read();
  const value = text.trim();
  if (value) notes[`${id}`] = value;
  else delete notes[`${id}`];
  try {
    localStorage.setItem(key, JSON.stringify(notes));
  } catch {
    return false;
  }
  return true;
}
