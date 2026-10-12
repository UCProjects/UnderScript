import { expect } from 'chai';
import { createChatHistory } from '../../src/utils/chatHistory';

class FakeStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }

  key(index) {
    return [...this.#items.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#items.has(key) ? this.#items.get(key) : null;
  }

  setItem(key, value) {
    this.#items.set(key, `${value}`);
  }

  removeItem(key) {
    this.#items.delete(key);
  }
}

const message = (id, extra = {}) => ({
  id,
  message: `text ${id}`,
  user: { id: 7, username: 'Frisk' },
  timestamp: 1000 + id,
  ...extra,
});

function setup(options = {}) {
  const storage = new FakeStorage();
  const timers = [];
  const history = createChatHistory({
    storage,
    now: () => 500000,
    schedule: (callback, delay) => timers.push({ callback, delay }),
    ...options,
  });
  return { storage, history, timers, runTimers: () => timers.splice(0).forEach(({ callback }) => callback()) };
}

const own = (storage, room) => JSON.parse(storage.getItem(`underscript.chat.public.${room}`));
const game = (storage, room) => JSON.parse(storage.getItem(`chat-public-room-${room}`));

describe('chat history', () => {
  describe('storing', () => {
    it('waits before writing, and writes a room once', () => {
      const { storage, history, timers, runTimers } = setup();
      history.add('1', message(1));
      history.add('1', message(2));
      expect(storage.getItem('underscript.chat.public.1')).to.equal(null);
      expect(timers).to.have.length(1);
      expect(timers[0].delay).to.equal(1000);
      runTimers();
      expect(own(storage, '1').map(({ id }) => id)).to.deep.equal([1, 2]);
    });

    it('ignores a message it already has', () => {
      const { history } = setup();
      expect(history.add('1', message(1))).to.equal(true);
      expect(history.add('1', message(1))).to.equal(false);
    });

    it('ignores things that are not messages', () => {
      const { history } = setup();
      expect(history.add('1', { text: 'no id' })).to.equal(false);
      expect(history.add('1', null)).to.equal(false);
    });

    it('keeps the newest messages up to the limit', () => {
      const { storage, history } = setup({ limit: 3 });
      [1, 2, 3, 4, 5].forEach((id) => history.add('1', message(id)));
      history.flush();
      expect(own(storage, '1').map(({ id }) => id)).to.deep.equal([3, 4, 5]);
    });

    it('keeps rooms apart', () => {
      const { storage, history } = setup();
      history.add('1', message(1));
      history.add('2', message(2));
      history.flush();
      expect(own(storage, '1')).to.have.length(1);
      expect(own(storage, '2')).to.have.length(1);
    });

    it('picks up what an earlier page stored', () => {
      const first = setup();
      first.history.add('1', message(1));
      first.history.flush();
      const second = createChatHistory({ storage: first.storage, now: () => 1, schedule: () => {} });
      second.add('1', message(2));
      second.flush();
      expect(own(first.storage, '1').map(({ id }) => id)).to.deep.equal([1, 2]);
    });
  });

  describe('restoring', () => {
    it('gives the game its messages back with fresh timestamps', () => {
      const { storage, history } = setup();
      history.add('1', message(1));
      history.add('1', message(2));
      history.restore();
      const restored = game(storage, '1');
      expect(restored.map(({ id }) => id)).to.deep.equal([1, 2]);
      expect(restored.every(({ timestamp }) => timestamp === 500000)).to.equal(true);
    });

    it('does not duplicate what the game already has, and orders by time', () => {
      const { storage, history } = setup();
      storage.setItem('chat-public-room-1', JSON.stringify([message(1), message(9)]));
      history.add('1', message(1));
      history.add('1', message(2));
      history.restore();
      expect(game(storage, '1').map(({ id }) => id)).to.deep.equal([1, 2, 9]);
    });

    it('keeps the limit', () => {
      const { storage, history } = setup({ limit: 2 });
      storage.setItem('chat-public-room-1', JSON.stringify([message(8), message(9)]));
      history.add('1', message(10));
      history.restore();
      expect(game(storage, '1').map(({ id }) => id)).to.deep.equal([9, 10]);
    });

    it('survives a damaged stored value', () => {
      const { storage, history } = setup();
      storage.setItem('chat-public-room-1', '{not json');
      storage.setItem('underscript.chat.public.2', 'also not json');
      history.add('1', message(1));
      expect(() => history.restore()).to.not.throw();
      expect(game(storage, '1').map(({ id }) => id)).to.deep.equal([1]);
    });

    it('leaves rooms it has nothing for alone', () => {
      const { storage, history } = setup();
      storage.setItem('chat-public-room-3', JSON.stringify([message(5)]));
      history.restore();
      expect(game(storage, '3').map(({ id }) => id)).to.deep.equal([5]);
    });

    it('writes pending messages first', () => {
      const { storage, history } = setup();
      history.add('1', message(1));
      history.restore();
      expect(own(storage, '1')).to.have.length(1);
    });
  });

  describe('removing a user', () => {
    it('drops their messages from every room, at once', () => {
      const { storage, history } = setup();
      history.add('1', message(1));
      history.add('1', message(2, { user: { id: 9 } }));
      history.add('2', message(3));
      history.flush();
      history.removeUser(7);
      expect(own(storage, '1').map(({ id }) => id)).to.deep.equal([2]);
      expect(storage.getItem('underscript.chat.public.2')).to.equal(null);
    });
  });
});
