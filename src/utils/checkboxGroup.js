import css from './checkboxGroup.css';
import styles from './style';
import toArray from './toArray';

styles.add(css);

const KEY = 'checkboxGroup';

let uid = 0;

function ensureId(element) {
  if (!element.attr('id')) {
    uid += 1;
    element.attr('id', `checkboxGroup-${uid}`);
  }
  return element.attr('id');
}

function createBox(name, text) {
  const input = $('<input type="checkbox">').attr('name', name).val(text);
  const label = $('<label>').append(input, ' ', $('<span>').append(text));
  return { input, label };
}

function createLeaf(groupName, value) {
  const [text, meta] = toArray(value);
  const { input, label } = createBox(groupName, text);
  const leaf = {
    parent: null,
    value: text,
    meta,
    element: $('<div class="checkItem">').append(label),
    get checked() {
      return input.prop('checked');
    },
    indeterminate: false,
    cascade(checked) {
      input.prop('checked', checked);
    },
    apply(predicate) {
      input.prop('checked', !!predicate({ value: text, meta }));
    },
    leaves() {
      return [leaf];
    },
  };
  input.on('change', () => leaf.parent?.refresh());
  return leaf;
}

class Group {
  parent = null;
  members = [];

  constructor(name, children, { collapsible = true, collapsed = false } = {}) {
    const { input, label } = createBox(name, name);
    const legend = $('<legend>');
    this.input = input;
    this.placeholder = $('<div class="checkEmpty">').text('(empty)');
    this.element = $('<fieldset class="checkGroup">')
      .toggleClass('checkFixed', !collapsible)
      .append(legend, this.placeholder)
      .data(KEY, this);
    if (collapsible) {
      this.toggle = $('<button type="button" class="checkToggle">')
        .attr('aria-label', label.text().trim())
        .on('click', () => {
          this.collapsed = !this.collapsed;
        });
      legend.append(this.toggle, ' ');
    }
    legend.append(label);
    input.on('change', () => {
      this.cascade(this.checked);
      this.refresh();
    });
    children.forEach((child) => this.add(child));
    this.collapsed = collapsed;
  }

  get collapsed() {
    return this.element.hasClass('collapsed');
  }

  set collapsed(value) {
    if (!this.toggle) return;
    this.element.toggleClass('collapsed', !!value);
    this.toggle.attr('aria-expanded', `${!value}`);
  }

  get checked() {
    return this.input.prop('checked');
  }

  get indeterminate() {
    return this.input.prop('indeterminate');
  }

  add(child) {
    const member = child instanceof $ ? child.data(KEY) : createLeaf(this.input.attr('name'), child);
    if (!member) throw new Error('Invalid checkbox group child');
    if (member.parent) throw new Error('Child already belongs to a group');
    member.parent = this;
    this.members.push(member);
    this.placeholder.detach();
    this.element.append(member.element);
    this.toggle?.attr('aria-controls', this.members.map((m) => ensureId(m.element)).join(' '));
    this.refresh();
  }

  cascade(value) {
    this.input.prop({ checked: value, indeterminate: false });
    this.members.forEach((member) => member.cascade(value));
  }

  apply(predicate) {
    this.members.forEach((member) => member.apply(predicate));
    this.sync();
  }

  reveal(depth) {
    this.collapsed = !this.leaves().some(({ checked }) => checked);
    if (depth > 1) this.members.forEach((member) => member.reveal?.(depth - 1));
  }

  collapseAll(collapsed) {
    this.members.forEach((member) => member.collapseAll?.(collapsed));
    this.collapsed = collapsed;
  }

  refresh() {
    this.sync();
    this.parent?.refresh();
  }

  sync() {
    const total = this.members.length;
    const checked = this.members.filter(({ checked: c }) => c).length;
    this.input.prop({
      checked: total > 0 && checked === total,
      indeterminate: this.members.some(({ indeterminate }) => indeterminate) || (checked > 0 && checked < total),
    });
  }

  leaves() {
    return this.members.flatMap((member) => member.leaves());
  }
}

export function getChecked(group) {
  return group.data(KEY).leaves()
    .filter(({ checked }) => checked)
    .map(({ value, meta }) => ({ value, meta }));
}

export function setChecked(group, predicate) {
  const target = group.data(KEY);
  target.apply(predicate);
  target.parent?.refresh();
}

export function revealChecked(group, depth = Infinity) {
  group.data(KEY).members.forEach((member) => member.reveal?.(depth));
}

export function setAllCollapsed(group, collapsed) {
  group.data(KEY).members.forEach((member) => member.collapseAll?.(collapsed));
}

export function isCollapsed(group) {
  return group.data(KEY).collapsed;
}

export function setCollapsed(group, collapsed) {
  group.data(KEY).collapsed = collapsed;
}

export default function checkboxGroup(name, children = [], options = {}) {
  return new Group(name, children, options).element;
}
