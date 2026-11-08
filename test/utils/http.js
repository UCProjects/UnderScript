import { expect } from 'chai';
import { get, post, HttpError } from '../../src/utils/http';
import { mockFetch, restoreFetch } from '../setup/fetch';

const reply = (body, { status = 200, headers = {} } = {}) => new Response(body, { status, headers });

describe('http', () => {
  afterEach(restoreFetch);

  describe('get', () => {
    it('parses a JSON body, whatever the content type', async () => {
      mockFetch(() => reply('{"a":1}', { headers: { 'content-type': 'text/html' } }));
      const { data, status } = await get('/x');
      expect(data).to.deep.equal({ a: 1 });
      expect(status).to.equal(200);
    });

    it('keeps text that is not JSON, and an empty body', async () => {
      mockFetch(() => reply('<html></html>'));
      expect((await get('/x')).data).to.equal('<html></html>');
      mockFetch(() => reply(''));
      expect((await get('/x')).data).to.equal('');
    });

    it('can ask for the text of a JSON body', async () => {
      mockFetch(() => reply('{"a":1}'));
      expect((await get('/x', { responseType: 'text' })).data).to.equal('{"a":1}');
    });

    it('adds the params to the address', async () => {
      const calls = mockFetch(() => reply('{}'));
      await get('https://example.com/DecksConfig', { params: { time: 5, flag: true } });
      await get('https://example.com/Page?a=1#top', { params: { b: 2 } });
      await get('https://example.com/Page?a=1', { params: { a: 2 } });
      expect(calls.map(({ input }) => input)).to.deep.equal([
        'https://example.com/DecksConfig?time=5&flag=true',
        'https://example.com/Page?a=1&b=2#top',
        'https://example.com/Page?a=2',
      ]);
    });

    it('resolves a relative address against the page when there are params', async () => {
      const calls = mockFetch(() => reply('{}'));
      globalThis.location = new URL('https://example.com/Crafting');
      try {
        await get('DecksConfig', { params: { time: 5 } });
      } finally {
        delete globalThis.location;
      }
      expect(calls[0].input).to.equal('https://example.com/DecksConfig?time=5');
    });

    it('leaves the address alone without params', async () => {
      const calls = mockFetch(() => reply('{}'));
      await get('Plain');
      await get('Plain', { params: {} });
      expect(calls.map(({ input }) => input)).to.deep.equal(['Plain', 'Plain']);
    });

    it('sends the headers and the GET method', async () => {
      const calls = mockFetch(() => reply('{}'));
      await get('/x', { headers: { Authorization: 'Bearer t' } });
      expect(calls[0].init.method).to.equal('GET');
      expect(calls[0].init.headers).to.deep.equal({ Authorization: 'Bearer t' });
      expect(calls[0].init.body).to.equal(undefined);
    });

    it('lowercases the headers it returns', async () => {
      mockFetch(() => reply('{}', { headers: { 'Retry-After': '3', 'X-Other': 'y' } }));
      const { headers } = await get('/x');
      expect(headers['retry-after']).to.equal('3');
      expect(headers['x-other']).to.equal('y');
    });
  });

  describe('post', () => {
    it('sends an object as JSON', async () => {
      const calls = mockFetch(() => reply('{"ok":true}'));
      const { data } = await post('/x', { action: 'craft', idCard: 5 });
      expect(calls[0].init.method).to.equal('POST');
      expect(calls[0].init.body).to.equal('{"action":"craft","idCard":5}');
      expect(calls[0].init.headers['Content-Type']).to.equal('application/json');
      expect(data).to.deep.equal({ ok: true });
    });

    it('keeps a content type that was given', async () => {
      const calls = mockFetch(() => reply('{}'));
      await post('/x', { a: 1 }, { headers: { 'content-type': 'application/vnd.test+json' } });
      expect(calls[0].init.headers).to.deep.equal({ 'content-type': 'application/vnd.test+json' });
    });

    it('sends form data as it is', async () => {
      const calls = mockFetch(() => reply('{}'));
      const form = new URLSearchParams({ a: '1' });
      await post('/x', form);
      expect(calls[0].init.body).to.equal(form);
      expect(calls[0].init.headers['Content-Type']).to.equal(undefined);
    });

    it('sends a string as it is', async () => {
      const calls = mockFetch(() => reply('{}'));
      await post('/x', 'a=1');
      expect(calls[0].init.body).to.equal('a=1');
    });

    it('sends no body without one', async () => {
      const calls = mockFetch(() => reply('{}'));
      await post('/x');
      expect(calls[0].init.body).to.equal(undefined);
    });
  });

  describe('failures', () => {
    it('rejects with the response when the status is not a success', async () => {
      mockFetch(() => reply('{"message":"no"}', { status: 429, headers: { 'Retry-After': '7' } }));
      const error = await get('/x').catch((e) => e);
      expect(error).to.be.instanceOf(HttpError);
      expect(error.message).to.equal('Request failed with status code 429');
      expect(error.response.status).to.equal(429);
      expect(error.response.headers['retry-after']).to.equal('7');
      expect(error.response.data).to.deep.equal({ message: 'no' });
    });

    it('rejects without a response when the request itself fails', async () => {
      mockFetch(() => { throw new TypeError('Failed to fetch'); });
      const error = await post('/x', {}).catch((e) => e);
      expect(error.message).to.equal('Failed to fetch');
      expect(error.response).to.equal(undefined);
    });
  });
});
