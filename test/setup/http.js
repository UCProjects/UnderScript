import { restoreFetch } from './fetch.js';

export function useAdapter(adapter) {
  globalThis.fetch = async (input, init = {}) => {
    const config = {
      url: `${input}`,
      method: (init.method ?? 'GET').toLowerCase(),
      data: init.body,
      headers: init.headers ?? {},
    };
    let response;
    try {
      response = await adapter(config);
    } catch (error) {
      if (!error?.response) throw error;
      response = error.response;
    }
    const { status = 200, data = '', headers = {} } = response;
    return new Response(typeof data === 'string' ? data : JSON.stringify(data), { status, headers });
  };
}

export { restoreFetch };

let current;

export function reinstall() {
  if (current) useAdapter(current);
}

export const network = {
  get adapter() {
    return current;
  },
  set adapter(adapter) {
    current = adapter;
    if (adapter) useAdapter(adapter);
    else restoreFetch();
  },
};
