import { expect } from 'chai';
import { ChatMessage, parseChatMessage } from '../../src/structures/chat/message';

const channel = { type: 'public', id: '1', room: 'chat-public-1' };
const raw = (extra = {}) => ({
  id: 101,
  user: { id: 7, username: 'Frisk', mainGroup: { id: 1, name: 'Player', priority: 99 }, groups: [] },
  message: 'hello',
  ...extra,
});

function render(html = 'hello <a href="#">link</a>', { room = channel.room, id = 101 } = {}) {
  const container = document.createElement('div');
  container.id = room;
  container.innerHTML = `<ul><li id="message-${id}"><span class="chat-message">${html}</span></li></ul>`;
  document.body.append(container);
  return container;
}

describe('ChatMessage', () => {
  let message;

  beforeEach(() => {
    message = parseChatMessage(raw(), channel);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is a ChatMessage', () => {
    expect(message).to.be.instanceOf(ChatMessage);
  });

  it('cannot be changed', () => {
    expect(Object.isFrozen(message)).to.equal(true);
    expect(() => {
      message.text = 'changed';
    }).to.throw(TypeError);
  });

  describe('element', () => {
    it('is null while its chat window is closed', () => {
      expect(message.element).to.equal(null);
    });

    it('finds the message in its own window', () => {
      const container = render();
      expect(message.element).to.equal(container.querySelector('#message-101'));
    });

    it('does not pick up the same id in another window', () => {
      render('other', { room: 'chat-public-2' });
      expect(message.element).to.equal(null);
    });
  });

  describe('display', () => {
    it('shows text without reading it as html', () => {
      const container = render();
      expect(message.display('<b>hi</b>')).to.equal(true);
      const body = container.querySelector('.chat-message');
      expect(body.textContent).to.equal('<b>hi</b>');
      expect(body.querySelector('b')).to.equal(null);
    });

    it('shows html when asked to', () => {
      const container = render();
      message.display('<b>hi</b>', { html: true });
      expect(container.querySelector('.chat-message b').textContent).to.equal('hi');
    });

    it('leaves the message itself alone', () => {
      render();
      message.display('changed');
      expect(message.text).to.equal('hello');
    });

    it('reports when there is nothing on screen to change', () => {
      expect(message.display('changed')).to.equal(false);
    });
  });

  describe('restore', () => {
    it('puts back what the game rendered', () => {
      const container = render();
      const original = container.querySelector('.chat-message').innerHTML;
      message.display('one');
      message.display('two');
      expect(message.restore()).to.equal(true);
      expect(container.querySelector('.chat-message').innerHTML).to.equal(original);
    });

    it('does nothing when nothing was changed', () => {
      render();
      expect(message.restore()).to.equal(false);
    });

    it('only restores once', () => {
      render();
      message.display('changed');
      expect(message.restore()).to.equal(true);
      expect(message.restore()).to.equal(false);
    });
  });
});
