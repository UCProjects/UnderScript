import Base from './FileParser';
import { hasToken } from '../githubAuth';

const RAW_ACCEPT = 'application/vnd.github.raw+json';

function parseContents(url) {
  const [owner, repo, ...rest] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) return undefined;
  const refParts = rest[0] === 'refs' ? 3 : 1;
  const ref = rest.slice(0, refParts).join('/');
  const path = rest.slice(refParts);
  if (!ref || !path.length) return undefined;
  return { owner, repo, ref, path: path.join('/') };
}

export default class GithubRaw extends Base {
  #contents;

  constructor(updateUrl, downloadUrl) {
    const url = new URL(updateUrl);
    if (url.hostname === 'github.com') {
      url.hostname = 'raw.githubusercontent.com';
    } else if (url.hostname !== 'raw.githubusercontent.com') {
      throw new Error('This parser is for github content only');
    }
    const raw = `${url}`.replace('/raw/', '/');
    super(raw, downloadUrl);
    this.#contents = parseContents(new URL(raw));
  }

  apiRequest() {
    if (!this.#contents) return undefined;
    const {
      owner,
      repo,
      ref,
      path,
    } = this.#contents;
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    return {
      url: `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(ref)}`,
      config: { headers: { Accept: RAW_ACCEPT } },
    };
  }

  async getUpdateData(url) {
    const request = url === undefined && hasToken() ? this.apiRequest() : undefined;
    if (request) {
      const data = await super.getUpdateData(request.url, request.config).catch(() => undefined);
      if (data !== undefined) return data;
    }
    return super.getUpdateData(url);
  }
}
