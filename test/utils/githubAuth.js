import { expect } from 'chai';
import { authenticatedGet, isGithubApi, onRateLimited, onTokenRejected, setTokenSource } from '../../src/utils/githubAuth';

const API = 'https://api.github.com/repos/owner/repo/releases/latest';

function httpError(status, headers = {}) {
  return Object.assign(new Error(`status ${status}`), { response: { status, headers } });
}

function recorder(...results) {
  const calls = [];
  const request = async (url, config) => {
    calls.push({ url, config });
    const result = results.shift();
    if (result instanceof Error) throw result;
    return result;
  };
  return { request, calls };
}

describe('isGithubApi', () => {
  it('matches only the api host', () => {
    expect(isGithubApi(API)).to.equal(true);
    expect(isGithubApi('https://raw.githubusercontent.com/owner/repo/main/file.js')).to.equal(false);
    expect(isGithubApi('https://api.github.com.evil.example/x')).to.equal(false);
    expect(isGithubApi('not a url')).to.equal(false);
  });
});

describe('authenticatedGet', () => {
  afterEach(() => {
    setTokenSource();
    onRateLimited();
    onTokenRejected();
  });

  it('sends no authorization without a token', async () => {
    const { request, calls } = recorder({ data: 1 });
    await authenticatedGet(request, API);
    expect(calls[0].config.headers).to.equal(undefined);
  });

  it('sends the token to the api', async () => {
    setTokenSource(() => ' abc ');
    const { request, calls } = recorder({ data: 1 });
    await authenticatedGet(request, API);
    expect(calls[0].config.headers.Authorization).to.equal('Bearer abc');
  });

  it('keeps the token away from other hosts', async () => {
    setTokenSource(() => 'abc');
    const { request, calls } = recorder({ data: 1 }, { data: 2 }, { data: 3 });
    await authenticatedGet(request, 'https://raw.githubusercontent.com/owner/repo/main/file.js');
    await authenticatedGet(request, 'https://example.com/api.github.com');
    await authenticatedGet(request, 'https://api.github.com.evil.example/x');
    calls.forEach(({ config }) => expect(config.headers).to.equal(undefined));
  });

  it('retries anonymously when the token is rejected', async () => {
    setTokenSource(() => 'bad');
    const { request, calls } = recorder(httpError(401), { data: 'ok' });
    const result = await authenticatedGet(request, API);
    expect(result.data).to.equal('ok');
    expect(calls).to.have.length(2);
    expect(calls[1].config.headers).to.equal(undefined);
  });

  it('reports a rejected token', async () => {
    let reports = 0;
    onTokenRejected(() => { reports += 1; });
    setTokenSource(() => 'bad');
    const { request } = recorder(httpError(401), { data: 'ok' });
    await authenticatedGet(request, API);
    expect(reports).to.equal(1);
  });

  it('does not report a rejected token when there is none', async () => {
    let reports = 0;
    onTokenRejected(() => { reports += 1; });
    const { request } = recorder(httpError(401));
    await authenticatedGet(request, API).catch(() => undefined);
    expect(reports).to.equal(0);
  });

  it('does not retry other failures', async () => {
    setTokenSource(() => 'abc');
    const { request, calls } = recorder(httpError(500));
    let failure;
    try {
      await authenticatedGet(request, API);
    } catch (e) {
      failure = e;
    }
    expect(failure.response.status).to.equal(500);
    expect(calls).to.have.length(1);
  });

  it('reports a spent request limit and rethrows', async () => {
    let reports = 0;
    onRateLimited(() => { reports += 1; });
    const { request } = recorder(httpError(403, { 'x-ratelimit-remaining': '0' }));
    let failure;
    try {
      await authenticatedGet(request, API);
    } catch (e) {
      failure = e;
    }
    expect(failure.response.status).to.equal(403);
    expect(reports).to.equal(1);
  });

  it('does not report a 403 that is not the request limit', async () => {
    let reports = 0;
    onRateLimited(() => { reports += 1; });
    const { request } = recorder(httpError(403, { 'x-ratelimit-remaining': '12' }));
    await authenticatedGet(request, API).catch(() => undefined);
    expect(reports).to.equal(0);
  });
});
