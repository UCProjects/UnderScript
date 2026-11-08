import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Nullish } from 'src/types/utility';
import { isRateLimited, retryAfter } from 'src/utils/rateLimit';

type Raw = Record<string, unknown>;

export type DeckBody =
  | { action: 'addCard' | 'removeCard'; idCard: number; isShiny: boolean; soul: string }
  | { action: 'addArtifact'; idArtifact: number; soul: string }
  | { action: 'removeAllCards' | 'clearArtifacts'; soul: string };

export type Outcome =
  | { type: 'ok'; data: Raw }
  | { type: 'refused'; data: Raw }
  | { type: 'empty' }
  | { type: 'limited'; retryAfter?: Nullish<number> }
  | { type: 'failed' };

const accepts: Record<DeckBody['action'], (data: Raw) => boolean> = {
  addCard: (data) => data.status !== 'error' && data.card !== undefined,
  removeCard: (data) => data.status === undefined,
  removeAllCards: (data) => data.status === undefined,
  addArtifact: (data) => data.action === 'getArtifactAdded',
  clearArtifacts: (data) => data.action === 'getArtifactsCleared',
};

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function post(body: DeckBody): Promise<Outcome> {
  try {
    const { data } = await axios.post<unknown>('DecksConfig', body, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (data === '' || data === null || data === undefined) return { type: 'empty' };
    if (!isRecord(data)) return { type: 'failed' };
    return accepts[body.action](data) ? { type: 'ok', data } : { type: 'refused', data };
  } catch (error) {
    const response = (error as { response?: AxiosResponse } | undefined)?.response;
    const header = (name: string) => response?.headers?.[name.toLowerCase()];
    if (response && isRateLimited(response.status, header)) {
      return { type: 'limited', retryAfter: retryAfter(header) };
    }
    return { type: 'failed' };
  }
}
