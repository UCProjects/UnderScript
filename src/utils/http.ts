export type HttpResponse<T = unknown> = {
  status: number;
  headers: Record<string, string>;
  data: T;
};

export type HttpConfig = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  responseType?: 'json' | 'text';
};

export const defaults = { timeout: 0 };

export class HttpError extends Error {
  response?: HttpResponse;

  url?: string;

  constructor(message: string, response?: HttpResponse, url?: string) {
    super(message);
    this.name = 'HttpError';
    this.response = response;
    this.url = url;
  }
}

function withParams(url: string, params?: HttpConfig['params']): string {
  if (!params || !Object.keys(params).length) return url;
  const target = new URL(url, globalThis.location?.href ?? 'http://localhost/');
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, `${value}`));
  return target.toString();
}

function headersOf(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

function parse(text: string, responseType: HttpConfig['responseType']): unknown {
  if (responseType === 'text') return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function encode(body: unknown, headers: Record<string, string>): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData) return body;
  if (!Object.keys(headers).some((name) => name.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }
  return JSON.stringify(body);
}

async function send<T>(
  method: 'GET' | 'POST',
  url: string,
  body: unknown,
  { headers = {}, params, responseType }: HttpConfig = {},
): Promise<HttpResponse<T>> {
  const sent = { ...headers };
  const init: RequestInit = { method, headers: sent };
  if (defaults.timeout > 0) init.signal = AbortSignal.timeout(defaults.timeout);
  const encoded = encode(body, sent);
  if (encoded !== undefined) init.body = encoded;
  const address = withParams(url, params);
  const result = await fetch(address, init);
  const response: HttpResponse<T> = {
    status: result.status,
    headers: headersOf(result.headers),
    data: parse(await result.text(), responseType) as T,
  };
  if (!result.ok) throw new HttpError(`Request failed with status code ${result.status}`, response, address);
  return response;
}

export function get<T = unknown>(url: string, config?: HttpConfig): Promise<HttpResponse<T>> {
  return send<T>('GET', url, undefined, config);
}

export function post<T = unknown>(url: string, body?: unknown, config?: HttpConfig): Promise<HttpResponse<T>> {
  return send<T>('POST', url, body, config);
}
