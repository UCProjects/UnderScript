const API_HOST = 'api.github.com';

let tokenSource = () => '';
let rateLimitListener = () => {};
let rejectedListener = () => {};

export function setTokenSource(source) {
  tokenSource = typeof source === 'function' ? source : () => '';
}

export function onRateLimited(listener) {
  rateLimitListener = typeof listener === 'function' ? listener : () => {};
}

export function onTokenRejected(listener) {
  rejectedListener = typeof listener === 'function' ? listener : () => {};
}

export function isGithubApi(url) {
  try {
    return new URL(url).hostname === API_HOST;
  } catch {
    return false;
  }
}

function isRateLimit({ response } = {}) {
  if (![403, 429].includes(response?.status)) return false;
  return `${response.headers?.['x-ratelimit-remaining']}` === '0';
}

function token() {
  return `${tokenSource() ?? ''}`.trim();
}

function currentToken(url) {
  return isGithubApi(url) ? token() : '';
}

export function hasToken() {
  return !!token();
}

async function anonymous(request, url, config) {
  try {
    return await request(url, config);
  } catch (error) {
    if (isGithubApi(url) && isRateLimit(error)) rateLimitListener();
    throw error;
  }
}

export async function authenticatedGet(request, url, config = {}) {
  const token = currentToken(url);
  if (!token) return anonymous(request, url, config);
  try {
    return await request(url, {
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error?.response?.status !== 401) throw error;
    rejectedListener();
  }
  return anonymous(request, url, config);
}
