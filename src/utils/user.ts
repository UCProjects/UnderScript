import axios from 'axios';
import type { Nullish } from 'src/types/utility';
import { global } from './global';
import * as api from './4.api';
import eventManager from './eventManager';
import sleep from './sleep';

type Self = {
  id: number;
  username: string;
  mainGroup: { priority: number };
};

type DeckConfig = {
  collection?: unknown;
  decks?: unknown;
  artifacts?: unknown;
  allArtifacts?: unknown;
};

type Deck = {
  soul: { name: string };
  cardsList: unknown;
  artifacts: unknown;
};

type Decks = Record<string, { artifacts: unknown; cards: unknown }>;

type PriorityUser = { mainGroup?: { priority?: unknown } };

let selfData: Readonly<Self> | undefined;
export function self(): Readonly<Self> {
  if (!selfData) {
    selfData = Object.freeze({
      id: global('selfId'),
      username: global('selfUsername'),
      mainGroup: global('selfMainGroup'),
    });
  }
  return selfData;
}

export function name(user: { username: string }): string {
  return user.username;
}

export function isMod(user: Nullish<PriorityUser>): boolean {
  return isPriority(user, 4);
}

export function isStaff(user: Nullish<PriorityUser>): boolean {
  return isPriority(user, 6);
}

export function isPriority(user: Nullish<PriorityUser>, priority: number): boolean {
  const value = user?.mainGroup?.priority;
  if (typeof value !== 'number') throw new Error('Invalid user');
  return value <= priority;
}

export function getCollection(): Promise<any> {
  return getDeckConfig().then(({ collection: data }) => parse(data));
}

export function getDecks(): Promise<Decks> {
  return getDeckConfig().then(({ decks: data }) => parse<Deck[]>(data))
    .then((decks) => decks.reduce((val, { soul: { name: soul }, cardsList: cards, artifacts }) => {
      val[soul] = { artifacts, cards };
      return val;
    }, {} as Decks));
}

export function getArtifacts(): Promise<any> {
  return getDeckConfig().then(({ artifacts: data }) => parse(data));
}

export function getAllArtifacts(): Promise<any> { // TODO: This isn't really a "user" function
  return getDeckConfig().then(({ allArtifacts: data = [] }) => parse(data));
}

let deckConfig: Promise<DeckConfig> | undefined;
function getDeckConfig(): Promise<DeckConfig> {
  if (!deckConfig) {
    deckConfig = new Promise<DeckConfig | undefined>((res) => {
      eventManager.once('Deck:Loaded', res);
      sleep(500).then(() => res(undefined));
    }).then((res) => {
      if (res) return res;
      return axios.get<DeckConfig>('DecksConfig').then(({ data }) => {
        eventManager.emit({ singleton: true }, 'Deck:Loaded', data);
        return data;
      });
    }).catch((err) => {
      deckConfig = undefined;
      throw err;
    });
  }
  return deckConfig;
}

function parse<T = any>(data: unknown): T {
  return (typeof data === 'string' ? JSON.parse(data) : data) as T;
}

export function getUCP(): Promise<number> {
  return axios.get(`CardSkinsConfig?action=profile&time=${Date.now()}`)
    .then(({ data: { ucp = 0 } }) => ucp);
}

export function getCardSkins(): Promise<any> {
  return axios.get('CardSkinsConfig?action=profile')
    .then(({ data: { cardSkins = '' } }) => JSON.parse(cardSkins));
}

const user = api.mod.user;
user.isMod = isMod;
user.isStaff = isStaff;
user.getCollection = getCollection;
user.getDecks = getDecks;
user.getArtifacts = getArtifacts;
user.getAllArtifacts = getAllArtifacts;
user.getUCP = getUCP;
user.getCardSkins = getCardSkins;
