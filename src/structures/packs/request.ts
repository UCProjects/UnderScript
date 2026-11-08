import { debug } from 'src/utils/debug';
import { packs as packsFlag } from 'src/utils/debugFlags';
import * as http from 'src/utils/http';
import type { HttpResponse } from 'src/utils/http';
import { isRateLimited, retryAfter } from 'src/utils/rateLimit';
import type { Attempt } from 'src/utils/workQueue';

export type PacksResponse = {
  action?: string;
  status?: number;
  message?: string;
  type?: string;
  cards?: string;
  golds?: number;
  ucp?: number;
};

export type Refusal = { refused: string };

function log({ status, headers }: Pick<HttpResponse, 'status' | 'headers'>, action: string) {
  debug(`PacksConfig ${status}`, packsFlag, action, headers);
}

export function attempt(action: string, expected: string): Promise<Attempt<PacksResponse | Refusal>> {
  return http.post<PacksResponse>('PacksConfig', { action }).then((response): Attempt<PacksResponse | Refusal> => {
    log(response, action);
    const { data } = response;
    if (!data || typeof data !== 'object') return { type: 'retry' };
    if (data.status !== undefined || data.action === 'getError') {
      return { type: 'ok', value: { refused: data.message ?? '' } };
    }
    if (data.action !== expected) return { type: 'retry' };
    return { type: 'ok', value: data };
  }).catch((error): Attempt<PacksResponse | Refusal> => {
    const response = error?.response as HttpResponse | undefined;
    if (!response) {
      debug(`PacksConfig failed: ${error?.message}`, packsFlag, action);
      return { type: 'retry' };
    }
    log(response, action);
    const header = (name: string) => response.headers?.[name.toLowerCase()];
    if (isRateLimited(response.status, header)) {
      return { type: 'limited', retryAfter: retryAfter(header) };
    }
    return { type: 'retry' };
  });
}
