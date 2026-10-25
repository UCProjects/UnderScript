import eventManager from 'src/utils/eventManager';

const EVENT = 'Card:Statuses';
const snapshots = new WeakMap();

function snapshot(statuses = []) {
  return new Map(statuses.map((status) => [status.name, { ...status }]));
}

function diff(before, statuses = []) {
  const after = snapshot(statuses);
  const added = [];
  const removed = [];
  const changed = [];
  after.forEach((status, name) => {
    const previous = before.get(name);
    if (!previous) added.push(status);
    else if (previous.counter !== status.counter) changed.push({ status, previous });
  });
  before.forEach((status, name) => {
    if (!after.has(name)) removed.push(status);
  });
  return { after, added, removed, changed };
}

eventManager.on('func:appendCard', (card, element) => {
  const node = element?.get?.(0);
  if (node) snapshots.set(node, snapshot(card.statuses));
});

eventManager.on('updateCard', function statusChanges(data) {
  const card = typeof data.card === 'string' ? JSON.parse(data.card) : data.card;
  const element = $(`#${card.id}`);
  const node = element.get(0);
  if (!node) return;
  const before = snapshots.get(node);
  const {
    after, added, removed, changed,
  } = diff(before || snapshot(card.statuses), card.statuses);
  snapshots.set(node, after);
  if (added.length || removed.length || changed.length) {
    eventManager.emit(EVENT, card, element, { added, removed, changed });
  }
});
