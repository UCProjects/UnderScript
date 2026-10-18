import { expect } from 'chai';
import axios from 'axios';
import { forgetGames, loadGames, parseGames } from '../../src/structures/chat/games';
import { findUser, syncFriends, updateUser } from '../../src/structures/chat/user';

const cell = (gameId, playerId) => `<td class="spectate-player " onclick="window.location = 'Spectate?gameId=${gameId}&amp;playerId=${playerId}';"></td>`;
const page = (rows) => `<html><body><table id="liste"><tbody>${rows.map((row) => `<tr>${row}<td class="home-match-time RANKED">0:04</td></tr>`).join('')}</tbody></table></body></html>`;
const parse = (html) => parseGames(new window.DOMParser().parseFromString(html, 'text/html'));
const user = (id, extra = {}) => ({
  id,
  username: `Player${id}`,
  mainGroup: { id: 1, name: 'Player', priority: 99 },
  groups: [],
  ...extra,
});

describe('chat games list', () => {
  describe('parsing', () => {
    it('finds both players of every game', () => {
      const games = parse(page([cell(2307, 792476) + cell(2307, 583443), cell(2310, 11) + cell(2310, 12)]));
      expect([...games]).to.deep.equal([
        ['792476', 2307],
        ['583443', 2307],
        ['11', 2310],
        ['12', 2310],
      ]);
    });

    it('finds nothing in an empty list or another page', () => {
      expect(parse(page([])).size).to.equal(0);
      expect(parse('<html><body><p>nothing</p></body></html>').size).to.equal(0);
    });

    it('skips cells that are not a spectate link', () => {
      const games = parse(page(['<td class="spectate-player" onclick="alert(1)"></td>']));
      expect(games.size).to.equal(0);
    });

    it('only reads the list on the page', () => {
      const html = `<body>${cell(1, 2)}<table id="liste"><tbody><tr>${cell(3, 4)}</tr></tbody></table></body>`;
      expect([...parse(html)]).to.deep.equal([['4', 3]]);
    });
  });

  describe('loading', () => {
    let originalAdapter;
    let requests;
    let html;

    const answer = (config) => {
      requests.push(config.url);
      return Promise.resolve({ data: html, status: 200, statusText: '', headers: {}, config });
    };

    before(() => {
      globalThis.DOMParser ??= window.DOMParser;
      originalAdapter = axios.defaults.adapter;
      axios.defaults.adapter = answer;
    });

    beforeEach(() => {
      axios.defaults.adapter = answer;
      requests = [];
      html = page([cell(5, 501) + cell(5, 502)]);
      forgetGames();
    });

    after(() => {
      axios.defaults.adapter = originalAdapter;
      forgetGames();
    });

    it('reads the home page', async () => {
      const games = await loadGames();
      expect(requests).to.deep.equal(['/']);
      expect(games.get('501')).to.equal(5);
    });

    it('asks once for requests made close together', async () => {
      await Promise.all([loadGames(), loadGames()]);
      await loadGames();
      expect(requests).to.have.length(1);
    });

    it('asks again after forgetting', async () => {
      await loadGames();
      forgetGames();
      await loadGames();
      expect(requests).to.have.length(2);
    });

    it('gives users the game they are in, and takes it from strangers who left', async () => {
      const left = updateUser(user('g2', { gameId: 98 }));
      const playing = updateUser(user('501', { gameId: 1 }));
      await loadGames();
      expect(left.gameId).to.equal(undefined);
      expect(playing.gameId).to.equal(5);
      expect(findUser('501')).to.equal(playing);
    });

    it('leaves friends to the friends poll when they are not listed', async () => {
      const friend = updateUser(user('g3', { gameId: 97 }));
      syncFriends([{ id: 'g3', username: 'Player g3', online: true, idGame: 97 }]);
      await loadGames();
      expect(friend.gameId).to.equal(97);
    });

    it('does not keep a failed request', async () => {
      axios.defaults.adapter = () => Promise.reject(new Error('offline'));
      let failed;
      try {
        await loadGames();
      } catch (e) {
        failed = e;
      }
      expect(failed).to.be.instanceOf(Error);
      axios.defaults.adapter = answer;
      await loadGames();
      expect(requests).to.have.length(1);
    });
  });
});
