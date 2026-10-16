import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { debug } from 'src/utils/debug';
import { craft as craftFlag } from 'src/utils/debugFlags';
import { isRateLimited, retryAfter } from 'src/utils/rateLimit';
import type { Attempt } from 'src/utils/workQueue';
import type { Nullish } from 'src/types/utility';

export type CraftBody =
  | { action: 'craft' | 'disenchant'; idCard: number; isShiny: boolean }
  | { action: 'auto' };

export type Outcome =
  | { type: 'ok'; response: AxiosResponse }
  | { type: 'refused'; data: unknown }
  | { type: 'retry' }
  | { type: 'limited'; retryAfter?: Nullish<number> };

function log({ status, headers }: Pick<AxiosResponse, 'status' | 'headers'>, body: CraftBody) {
  debug(`CraftConfig ${status}`, craftFlag, body, headers);
}

export function post(body: CraftBody): Promise<Outcome> {
  return axios.post('CraftConfig', body, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response): Outcome => {
    log(response, body);
    debug(response);
    if (response.data === '' || response.data == null) return { type: 'retry' };
    if (response.data.status !== 'success') return { type: 'refused', data: response.data };
    return { type: 'ok', response };
  }).catch((error): Outcome => {
    const response = error?.response as AxiosResponse | undefined;
    if (!response) {
      debug(`CraftConfig failed: ${error?.message}`, craftFlag, body);
      return { type: 'retry' };
    }
    log(response, body);
    const header = (name: string) => response.headers?.[name.toLowerCase()];
    if (isRateLimited(response.status, header)) {
      return { type: 'limited', retryAfter: retryAfter(header) };
    }
    return { type: 'retry' };
  });
}

export function attempt(body: CraftBody): Promise<Attempt<AxiosResponse>> {
  return post(body).then((outcome): Attempt<AxiosResponse> => {
    switch (outcome.type) {
      case 'ok':
        return { type: 'ok', value: outcome.response };
      case 'refused':
        return { type: 'skip' };
      case 'limited':
        return { type: 'limited', retryAfter: outcome.retryAfter };
      default:
        return { type: 'retry' };
    }
  });
}
