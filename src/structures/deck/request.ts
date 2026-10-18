import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { isRateLimited } from 'src/utils/rateLimit';

type Raw = Record<string, unknown>;

export type DeckBody =
  | { action: 'addCard' | 'removeCard'; idCard: number; isShiny: boolean; soul: string }
  | { action: 'addArtifact'; idArtifact: number; soul: string }
  | { action: 'removeAllCards' | 'clearArtifacts'; soul: string };

export type Outcome =
  | { type: 'ok'; data: Raw }
  | { type: 'refused'; data: Raw }
  | { type: 'empty' }
  | { type: 'limited' }
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
    if (response && isRateLimited(response.status, (name) => response.headers?.[name.toLowerCase()])) {
      return { type: 'limited' };
    }
    return { type: 'failed' };
  }
}
