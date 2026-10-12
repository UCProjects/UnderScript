import { expect } from 'chai';
import { noticeEvent, parseNotice } from '../../src/structures/chat/notice';

const serverMessage = (...args) => JSON.stringify({ args: JSON.stringify(args) });
const upper = (message) => JSON.parse(JSON.parse(message).args).join(' ').toUpperCase();

describe('noticeEvent', () => {
  it('sorts the server frames into notices and rejections', () => {
    expect(noticeEvent('getInfoMessage')).to.equal('notice');
    expect(noticeEvent('getMessageAuto')).to.equal('notice');
    expect(noticeEvent('getMessageBroadcast')).to.equal('notice');
    expect(noticeEvent('getMessageError')).to.equal('rejected');
    expect(noticeEvent('getMessageDenied')).to.equal('rejected');
  });

  it('ignores everything else', () => {
    expect(noticeEvent('getMessage')).to.equal(undefined);
    expect(noticeEvent('ping')).to.equal(undefined);
    expect(noticeEvent(undefined)).to.equal(undefined);
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
