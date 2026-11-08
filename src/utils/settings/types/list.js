import clone from 'src/utils/clone';
import getTextValue from 'src/utils/getTextValue';
import Setting from './array';

export default class List extends Setting {
  constructor(name = 'list') {
    super(name);
  }

  value(val, data = []) {
    const value = super.value(val)
      .map((o) => data.find((i) => getTextValue(i).value === o)) // Convert value to parent data
      .filter((_) => _); // Remove invalid data

    // For new additions, add to the end of value list
    if (value.length !== data.length) {
      data.forEach((o) => {
        if (value.includes(o)) return;
        value.push(o);
      });
    }

    // Don't ever expose the raw data refs to others. Only the owner of the data should have/edit the references... child data is OK by design though
    return value.map(clone);
  }

  default(data = []) {
    return data.map(clone);
  }

  encode(value = []) {
    return super.encode(value.map((item) => getTextValue(item).value));
  }

  element(value, update) {
    // Sortable list
    const list = $('<ol>').addClass('sortedList');
    let dragged;
    function dragging(e) {
      dragged = e.target;
      e.dataTransfer.effectAllowed = 'move';
    }
    function draggedOver(e) {
      // Only allow same list elements
      if (!dragged || e.target.parentElement !== dragged.parentElement) return;
      e.preventDefault(); // Allow dropping
    }
    function dropped(e) {
      e.preventDefault(); // Prevent potential bugs
      if (!dragged || e.target.parentElement !== dragged.parentElement || e.target === dragged) return;
      // Move to new position
      const target = list.children();
      const from = target.index(dragged);
      const to = target.index(e.target);
      value.splice(to, 0, ...value.splice(from, 1));
      update(value);

      if (from < to) {
        $(e.target).after(dragged);
      } else {
        $(e.target).before(dragged);
      }
      dragged = null;
    }
    function addItem(o) {
      // Create element
      const node = document.createElement('li');
      node.innerText = getTextValue(o).text;
      node.draggable = true;
      if (typeof o.class === 'string') {
        node.classList.add(...o.class.trim().split(/\s+/));
      }
      // Add listeners
      node.addEventListener('dragstart', dragging);
      node.addEventListener('dragover', draggedOver);
      node.addEventListener('drop', dropped);
      // Add to container
      list.append(node);
    }
    value.forEach(addItem);
    return list;
  }

  styles() {
    return [
      '.sortedList { flex-basis: 100%; padding: 0; list-style-position: inside; }',
      '.sortedList li { cursor: grab; }',
    ];
  }
}
