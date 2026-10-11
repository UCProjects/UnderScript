import { expect } from 'chai';
import axios from 'axios';
import GithubRaw from '../../src/utils/parser/GithubRaw';
import { setTokenSource } from '../../src/utils/githubAuth';

const META = '// ==UserScript==\n// @version 1.2.3\n// ==/UserScript==';

describe('GithubRaw', () => {
  describe('apiRequest', () => {
    it('maps a raw url to the contents api', () => {
      const parser = new GithubRaw('https://raw.githubusercontent.com/owner/repo/main/dir/file.js');
      expect(parser.apiRequest()).to.deep.equal({
        url: 'https://api.github.com/repos/owner/repo/contents/dir/file.js?ref=main',
        config: { headers: { Accept: 'application/vnd.github.raw+json' } },
      });
    });

    it('maps a github raw url', () => {
      const parser = new GithubRaw('https://github.com/owner/repo/raw/main/file.js');
      expect(parser.apiRequest().url).to.equal('https://api.github.com/repos/owner/repo/contents/file.js?ref=main');
    });

    it('keeps a fully qualified ref together', () => {
      const parser = new GithubRaw('https://raw.githubusercontent.com/owner/repo/refs/heads/main/file.js');
      expect(parser.apiRequest().url).to.equal('https://api.github.com/repos/owner/repo/contents/file.js?ref=refs%2Fheads%2Fmain');
    });

    it('gives nothing when there is no file path', () => {
      const parser = new GithubRaw('https://raw.githubusercontent.com/owner/repo/main');
      expect(parser.apiRequest()).to.equal(undefined);
    });
  });

  describe('getUpdateData', () => {
    const original = axios.get;
    let calls;

    function respond(handler) {
      axios.get = async (url, config) => {
        calls.push({ url, config });
        return handler(url, config);
      };
    }

    beforeEach(() => {
      calls = [];
    });

    afterEach(() => {
      axios.get = original;
      setTokenSource();
    });

    it('uses the raw url without a token', async () => {
      respond(() => ({ data: META }));
      const parser = new GithubRaw('https://raw.githubusercontent.com/owner/repo/main/file.js');
      const data = await parser.getUpdateData();
      expect(data.version).to.equal('1.2.3');
      expect(calls).to.have.length(1);
      expect(calls[0].url).to.contain('raw.githubusercontent.com');
    });

    it('uses the api with a token', async () => {
      setTokenSource(() => 'abc');
      respond(() => ({ data: META }));
      const parser = new GithubRaw('https://raw.githubusercontent.com/owner/repo/main/file.js');
      await parser.getUpdateData();
      expect(calls).to.have.length(1);
      expect(calls[0].url).to.contain('api.github.com');
      expect(calls[0].config.headers.Authorization).to.equal('Bearer abc');
      expect(calls[0].config.headers.Accept).to.equal('application/vnd.github.raw+json');
    });

    it('falls back to the raw url when the api fails', async () => {
      setTokenSource(() => 'abc');
      respond((url) => {
        if (url.includes('api.github.com')) {
          throw Object.assign(new Error('nope'), { response: { status: 500, headers: {} } });
        }
        return { data: META };
      });
      const parser = new GithubRaw('https://raw.githubusercontent.com/owner/repo/main/file.js');
      const data = await parser.getUpdateData();
      expect(data.version).to.equal('1.2.3');
      expect(calls.map(({ url }) => new URL(url).hostname)).to.deep.equal([
        'api.github.com',
        'raw.githubusercontent.com',
      ]);
    });
  });
});
