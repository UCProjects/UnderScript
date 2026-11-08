import { expect } from 'chai';
import * as registry from 'src/utils/pluginRegistry';
import { network } from '../setup/http';

const LIST = 'underscript.registry.list';
const script = (version, download) => [
  '// ==UserScript==',
  `// @version ${version}`,
  `// @downloadURL ${download}`,
  '// ==/UserScript==',
].join('\n');

describe('pluginRegistry', () => {
  let responses;

  beforeEach(() => {
    responses = new Map();
    network.adapter = ({ url }) => {
      if (!responses.has(url)) throw new Error(`Unexpected request: ${url}`);
      const value = responses.get(url);
      if (value instanceof Error) throw value;
      return { data: value };
    };
  });

  afterEach(() => {
    network.adapter = undefined;
  });

  function serve(entries) {
    responses.set(
      'https://raw.githubusercontent.com/UCProjects/UnderScript/refs/heads/master/plugins.json',
      entries,
    );
  }

  describe('load', () => {
    it('keeps only valid entries and their known fields', async () => {
      serve([
        { name: 'Good', author: 'someone', updateURL: 'https://example.com/good.user.js', extra: 1 },
        { name: 'Download only', downloadURL: 'https://example.com/d.user.js' },
        { name: '', updateURL: 'https://example.com/empty-name.user.js' },
        { name: 'No urls' },
        { updateURL: 'https://example.com/no-name.user.js' },
        null,
      ]);
      await registry.load(true);
      expect(registry.status()).to.equal('ready');
      expect(registry.plugins()).to.deep.equal([
        { name: 'Good', author: 'someone', updateURL: 'https://example.com/good.user.js', downloadURL: undefined },
        { name: 'Download only', author: undefined, updateURL: undefined, downloadURL: 'https://example.com/d.user.js' },
      ]);
    });

    it('caches the fetched list', async () => {
      serve([{ name: 'Cached', updateURL: 'https://example.com/c.user.js' }]);
      await registry.load(true);
      const cache = JSON.parse(localStorage.getItem(LIST));
      expect(cache.plugins.map(({ name }) => name)).to.deep.equal(['Cached']);
      expect(cache.time).to.be.a('number');
    });

    it('falls back to the cached list when the request fails', async () => {
      localStorage.setItem(LIST, JSON.stringify({
        time: 0,
        plugins: [{ name: 'Stale', updateURL: 'https://example.com/s.user.js' }],
      }));
      serve(new Error('offline'));
      await registry.load(true);
      expect(registry.status()).to.equal('ready');
      expect(registry.plugins().map(({ name }) => name)).to.deep.equal(['Stale']);
    });

    it('reports an error when the request fails with nothing cached', async () => {
      serve(new Error('offline'));
      await registry.load(true);
      expect(registry.status()).to.equal('error');
      expect(registry.plugins()).to.deep.equal([]);
    });

    it('rejects a list that is not an array', async () => {
      serve({ plugins: [] });
      await registry.load(true);
      expect(registry.status()).to.equal('error');
    });
  });

  describe('refresh', () => {
    it('resolves the latest version and download link', async () => {
      serve([{ name: 'Alpha', updateURL: 'https://example.com/alpha.user.js' }]);
      responses.set('https://example.com/alpha.user.js', script('1.2.3', 'https://example.com/alpha.user.js'));
      await registry.refresh({ force: true });
      expect(registry.info('Alpha')).to.include({
        version: '1.2.3',
        url: 'https://example.com/alpha.user.js',
      });
    });

    it('marks a plugin as failed when its script cannot be read', async () => {
      serve([{ name: 'Broken', updateURL: 'https://example.com/broken.user.js' }]);
      responses.set('https://example.com/broken.user.js', new Error('404'));
      await registry.refresh({ force: true });
      expect(registry.info('Broken').error).to.equal(true);
      expect(registry.info('Broken').version).to.equal(undefined);
    });

    it('keeps resolving the other plugins when one fails', async () => {
      serve([
        { name: 'Bad', updateURL: 'https://example.com/bad.user.js' },
        { name: 'Fine', updateURL: 'https://example.com/fine.user.js' },
      ]);
      responses.set('https://example.com/bad.user.js', new Error('500'));
      responses.set('https://example.com/fine.user.js', script('2.0.0', 'https://example.com/fine.user.js'));
      await registry.refresh({ force: true });
      expect(registry.info('Bad').error).to.equal(true);
      expect(registry.info('Fine').version).to.equal('2.0.0');
    });
  });

  describe('modified', () => {
    const META = 'https://raw.githubusercontent.com/UCProjects/UnderScript/refs/heads/registry/plugins.meta.json';

    function listAlpha(version) {
      serve([{ name: 'Alpha', updateURL: 'https://example.com/alpha.user.js' }]);
      responses.set('https://example.com/alpha.user.js', script(version, 'https://example.com/alpha.user.js'));
    }

    it('gives the date when the version matches', async () => {
      listAlpha('1.2.3');
      responses.set(META, { Alpha: { version: '1.2.3', date: '2026-10-01T12:00:00Z' } });
      await registry.refresh({ force: true });
      expect(registry.datesLoaded()).to.equal(true);
      expect(registry.modified('Alpha')).to.equal(Date.parse('2026-10-01T12:00:00Z'));
    });

    it('drops the date when the version moved on', async () => {
      listAlpha('1.3.0');
      responses.set(META, { Alpha: { version: '1.2.3', date: '2026-10-01T12:00:00Z' } });
      await registry.refresh({ force: true });
      expect(registry.modified('Alpha')).to.equal(undefined);
    });

    it('ignores malformed entries', async () => {
      listAlpha('1.2.3');
      responses.set(META, { Alpha: { version: '1.2.3', date: 'never' }, Beta: 5 });
      await registry.refresh({ force: true });
      expect(registry.modified('Alpha')).to.equal(undefined);
    });

    it('shows no dates when the file is unavailable', async () => {
      listAlpha('1.2.3');
      responses.set(META, new Error('404'));
      await registry.refresh({ force: true });
      expect(registry.datesLoaded()).to.equal(true);
      expect(registry.modified('Alpha')).to.equal(undefined);
    });
  });

  describe('running plugins', () => {
    it('reports nothing running when no plugin registered', () => {
      expect(registry.isRunning('Nothing')).to.equal(false);
      expect(registry.wasSeen('Nothing')).to.equal(false);
    });
  });
});
