import axios from 'axios';
import { syncGames } from './user';

type Games = ReadonlyMap<string, number>;

const maxAge = 5000;
let loading: Promise<Games> | undefined;
let loadedAt = 0;

export function parseGames(root: ParentNode): Map<string, number> {
  const games = new Map<string, number>();
  root.querySelectorAll('#liste td.spectate-player[onclick]').forEach((cell) => {
    const match = /gameId=(\d+)&playerId=(\d+)/.exec(cell.getAttribute('onclick') ?? '');
    if (match) games.set(match[2], Number(match[1]));
  });
  return games;
}

export function forgetGames(): void {
  loading = undefined;
}

export function loadGames(): Promise<Games> {
  if (loading && Date.now() - loadedAt < maxAge) return loading;
  loadedAt = Date.now();
  const request = axios.get<string>('/', { responseType: 'text' }).then(({ data }) => {
    const games = parseGames(new DOMParser().parseFromString(data, 'text/html'));
    syncGames(games);
    return games;
  });
  loading = request;
  request.catch(() => {
    if (loading === request) loading = undefined;
  });
  return request;
}
