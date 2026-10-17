import { expect } from 'chai';
import { eventOf, parseNotice } from '../../src/structures/chat/notice';

const serverMessage = (...args) => JSON.stringify({ args: JSON.stringify(args) });
const upper = (message) => JSON.parse(JSON.parse(message).args).join(' ').toUpperCase();

describe('eventOf', () => {
  const read = (action, ...args) => parseNotice({ action, message: serverMessage(...args) });

  it('sorts the server frames into notices and rejections', () => {
    expect(eventOf(read('getInfoMessage', 'chat-user-offline'))).to.equal('notice');
    expect(eventOf(read('getMessageAuto', 'chat-legendary-notification'))).to.equal('notice');
    expect(eventOf(read('getMessageError', 'chat-link'))).to.equal('rejected');
    expect(eventOf(read('getMessageDenied', 'chat-link'))).to.equal('rejected');
    expect(eventOf(parseNotice({ action: 'getMessageBroadcast', message: 'Hello' }))).to.equal('notice');
  });

  it('counts the lines that refuse a message, which the server sends as info', () => {
    [
      'chat-spam-protection',
      'chat-restricted',
      'chat-banned',
      'chat-link',
      'chat-permission',
      'chat-bad-usage',
      'chat-power',
      'chat-not-connected',
    ].forEach((key) => {
      expect(eventOf(read('getInfoMessage', key, 3)), key).to.equal('rejected');
    });
  });

  it('leaves other info lines as notices', () => {
    ['chat-user-timed-out', 'chat-self-timed-out', 'chat-no-longer-banned', 'chat-not-allowed'].forEach((key) => {
      expect(eventOf(read('getInfoMessage', key, 3)), key).to.equal('notice');
    });
  });

  it('does not count an announcement or a broadcast, whatever it says', () => {
    expect(eventOf(read('getMessageAuto', 'chat-spam-protection'))).to.equal('notice');
    expect(eventOf(parseNotice({ action: 'getMessageBroadcast', message: 'chat-spam-protection' }))).to.equal('notice');
  });

  it('is not fooled by a missing key', () => {
    expect(eventOf(parseNotice({ action: 'getInfoMessage', message: 'plain text' }))).to.equal('notice');
  });
});

describe('parseNotice', () => {
  it('reads the key and arguments the server sent', () => {
    const notice = parseNotice({ action: 'getInfoMessage', message: serverMessage('chat-user-offline', 'Frisk', 3) });
    expect(notice.kind).to.equal('info');
    expect(notice.key).to.equal('chat-user-offline');
    expect(notice.args).to.deep.equal(['Frisk', 3]);
  });

  it('uses the translation it is given', () => {
    const notice = parseNotice({ action: 'getMessageError', message: serverMessage('chat-error', 'x') }, upper);
    expect(notice.kind).to.equal('error');
    expect(notice.text).to.equal('CHAT-ERROR X');
  });

  it('falls back to the key when it cannot translate', () => {
    const none = parseNotice({ action: 'getMessageDenied', message: serverMessage('chat-denied') });
    expect(none.kind).to.equal('denied');
    expect(none.text).to.equal('chat-denied');
    const broken = parseNotice({ action: 'getMessageDenied', message: serverMessage('chat-denied') }, () => { throw new Error('x'); });
    expect(broken.text).to.equal('chat-denied');
    const empty = parseNotice({ action: 'getMessageDenied', message: serverMessage('chat-denied') }, () => '');
    expect(empty.text).to.equal('chat-denied');
  });

  it('reads an announcement and who it is about', () => {
    const notice = parseNotice({
      action: 'getMessageAuto',
      type: 'legendary-drop',
      idUser: 12,
      message: serverMessage('chat-legendary-notification', 'Frisk', 'Card'),
    });
    expect(notice.kind).to.equal('auto');
    expect(notice.type).to.equal('legendary-drop');
    expect(notice.userId).to.equal(12);
    expect(notice.args).to.deep.equal(['Frisk', 'Card']);
  });

  it('shows a broadcast as sent, without treating it as a key', () => {
    const notice = parseNotice({ action: 'getMessageBroadcast', message: 'Maintenance at noon' }, upper);
    expect(notice.kind).to.equal('broadcast');
    expect(notice.text).to.equal('Maintenance at noon');
    expect(notice.key).to.equal(undefined);
    expect(notice.args).to.deep.equal([]);
  });

  it('survives a message it cannot read', () => {
    ['not json', '{}', JSON.stringify({ args: 'not json' }), JSON.stringify({ args: '5' })].forEach((message) => {
      const notice = parseNotice({ action: 'getInfoMessage', message });
      expect(notice.key).to.equal(undefined);
      expect(notice.args).to.deep.equal([]);
    });
    expect(parseNotice({ action: 'getInfoMessage' }).text).to.equal('');
  });

  it('keeps the original frame', () => {
    const frame = { action: 'getInfoMessage', message: serverMessage('a') };
    expect(parseNotice(frame).raw).to.equal(frame);
  });

  it('gives nothing for frames that are not notices', () => {
    expect(parseNotice({ action: 'getMessage' })).to.equal(undefined);
    expect(parseNotice(null)).to.equal(undefined);
    expect(parseNotice('x')).to.equal(undefined);
  });
});
