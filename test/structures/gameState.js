import { expect } from 'chai';
import GameState from '../../src/structures/game/state';

const ME = 10;
const THEM = 20;
const card = (id, extra = {}) => ({ id, name: `Card ${id}`, cost: 1, ownerId: ME, ...extra });
const player = (id, extra = {}) => ({
  id, username: `user${id}`, soul: { id: 1, name: 'KINDNESS' }, hp: 30, maxHp: 30, golds: 1, ...extra,
});
const connect = (extra = {}) => ({
  action: 'connect',
  gameId: 7,
  gameType: 'CPU',
  you: JSON.stringify(player(ME)),
  enemy: JSON.stringify(player(THEM, { username: 'CPU' })),
  handsSize: JSON.stringify({ [ME]: 2, [THEM]: 3 }),
  decksSize: JSON.stringify({ [ME]: 20, [THEM]: 18 }),
  golds: JSON.stringify({ [ME]: 1, [THEM]: 2 }),
  board: JSON.stringify([card(1, { attack: 1, hp: 2 }), card(2, { ownerId: THEM, attack: 2, hp: 2 })]),
  hand: JSON.stringify([card(3), card(4)]),
  slots: JSON.stringify([{ id: 0 }, { id: 1, enchant: { name: 'FIRE' } }]),
  turn: 1,
  userTurn: ME,
  playableCards: JSON.stringify([3]),
  playableNoTargets: '[]',
  playableTriggers: '[]',
  availableAttackTargets: JSON.stringify({ 1: [2] }),
  ...extra,
});

describe('game state', () => {
  let game;
  let seen;

  beforeEach(() => {
    game = new GameState();
    seen = [];
    ['started', 'turn', 'played', 'died', 'finished'].forEach((event) => {
      game.on(event, (...args) => seen.push([event, ...args]));
    });
  });

  it('is empty before a game', () => {
    expect(game.active).to.equal(false);
    expect(game.player).to.equal(undefined);
    expect(game.hand).to.deep.equal([]);
    expect(game.board).to.deep.equal([]);
  });

  it('reads everything from connect', () => {
    game.apply(connect());
    expect(game.active).to.equal(true);
    expect(game.id).to.equal(7);
    expect(game.type).to.equal('CPU');
    expect(game.turn).to.equal(1);
    expect(game.myTurn).to.equal(true);
    expect(game.player).to.deep.include({
      id: ME, username: `user${ME}`, soul: 'KINDNESS', hp: 30, maxHp: 30, gold: 1, handSize: 2, deckSize: 20,
    });
    expect(game.opponent).to.deep.include({ id: THEM, username: 'CPU', gold: 2, handSize: 3, deckSize: 18 });
    expect(game.hand.map(({ id }) => id)).to.deep.equal([3, 4]);
    expect(game.board.map(({ id }) => id)).to.deep.equal([1, 2]);
    expect(game.slots.map(({ id }) => id)).to.deep.equal([0, 1]);
    expect(game.playable.playableCards).to.deep.equal([3]);
    expect(game.playable.availableAttackTargets).to.deep.equal({ 1: [2] });
    expect(seen).to.deep.equal([['started']]);
  });

  it('runs a story opponent name through the translator', () => {
    game.apply(connect({
      gameType: 'STORY',
      enemy: JSON.stringify(player(0, { username: 'story-fight-3-name' })),
      golds: JSON.stringify({ [ME]: 1, 0: 2 }),
    }));
    expect(game.opponent.id).to.equal(0);
    expect(game.opponent.username).to.equal('story-fight-3-name');
    expect(game.opponent.gold).to.equal(2);
  });

  it('accepts frames whose fields are already objects', () => {
    game.apply(connect({
      you: player(ME), enemy: player(THEM), hand: [card(3)], board: [], golds: { [ME]: 4 },
    }));
    expect(game.hand).to.have.length(1);
    expect(game.player.gold).to.equal(4);
  });

  it('starts over when the game connects again', () => {
    game.apply(connect());
    game.apply({ action: 'getUpdateHand', hand: '[]' });
    game.apply(connect({ turn: 3 }));
    expect(game.turn).to.equal(3);
    expect(game.hand).to.have.length(2);
    expect(seen).to.deep.equal([['started'], ['started']]);
  });

  it('announces the next game as new after a result', () => {
    game.apply(connect());
    game.apply({ action: 'getVictory' });
    game.apply(connect());
    expect(seen.map(([event]) => event)).to.deep.equal(['started', 'finished', 'started']);
  });

  it('tracks turns', () => {
    game.apply(connect());
    game.apply({ action: 'getTurnStart', idPlayer: THEM, numTurn: 2 });
    expect(game.turn).to.equal(2);
    expect(game.myTurn).to.equal(false);
    expect(seen.at(-1)).to.deep.equal(['turn', 2, false]);
  });

  it('replaces the hand, board and playable cards', () => {
    game.apply(connect());
    game.apply({ action: 'getUpdateHand', hand: JSON.stringify([card(9)]) });
    game.apply({ action: 'getUpdateBoard', board: JSON.stringify([]) });
    game.apply({ action: 'getPlayableCards', playableCards: '[9]' });
    expect(game.hand.map(({ id }) => id)).to.deep.equal([9]);
    expect(game.board).to.deep.equal([]);
    expect(game.playable.playableCards).to.deep.equal([9]);
    expect(game.playable.availableAttackTargets).to.deep.equal({});
  });

  it('updates slots, hp and stats', () => {
    game.apply(connect());
    game.apply({ action: 'getUpdateSlot', slot: JSON.stringify({ id: 0, enchant: { name: 'ICE' } }) });
    game.apply({ action: 'getUpdatePlayerHp', playerId: THEM, hp: 12, maxHp: 31 });
    game.apply({ action: 'getPlayersStats', golds: JSON.stringify({ [ME]: 5 }), handsSize: '{}', decksSize: '{}' });
    expect(game.slots[0].enchant.name).to.equal('ICE');
    expect(game.opponent).to.deep.include({ hp: 12, maxHp: 31 });
    expect(game.player.gold).to.equal(5);
    expect(game.opponent.gold).to.equal(2);
  });

  it('moves a played monster from the hand to the board', () => {
    game.apply(connect());
    game.apply({
      action: 'getMonsterPlayed', idPlayer: ME, x: 2, card: JSON.stringify(card(3, { attack: 1, hp: 1 })),
    });
    expect(game.hand.map(({ id }) => id)).to.deep.equal([4]);
    expect(game.board.find(({ id }) => id === 3)).to.deep.include({ ownerId: ME, boardPosition: 2 });
    expect(seen.at(-1)[0]).to.equal('played');
    expect(seen.at(-1)[2]).to.equal(true);
  });

  it('takes a played spell out of the hand without placing it', () => {
    game.apply(connect());
    game.apply({ action: 'getSpellPlayed', idPlayer: THEM, card: JSON.stringify(card(3)) });
    expect(game.hand.map(({ id }) => id)).to.deep.equal([4]);
    expect(game.board).to.have.length(2);
    expect(seen.at(-1)[2]).to.equal(false);
  });

  it('removes a destroyed monster and announces it', () => {
    game.apply(connect());
    game.apply({ action: 'getMonsterDestroyed', monsterId: 2 });
    expect(game.board.map(({ id }) => id)).to.deep.equal([1]);
    expect(seen.at(-1)[0]).to.equal('died');
    expect(seen.at(-1)[1].id).to.equal(2);
    game.apply({ action: 'getMonsterDestroyed', monsterId: 99 });
    expect(seen).to.have.length(2);
  });

  it('merges card updates into whichever list holds the card', () => {
    game.apply(connect());
    game.apply({ action: 'updateCard', card: JSON.stringify({ id: 1, attack: 5 }) });
    game.apply({ action: 'updateCard', card: JSON.stringify({ id: 4, cost: 0 }) });
    game.apply({ action: 'updateCard', card: JSON.stringify({ id: 999, cost: 0 }) });
    expect(game.board.find(({ id }) => id === 1)).to.deep.include({ attack: 5, hp: 2 });
    expect(game.hand.find(({ id }) => id === 4).cost).to.equal(0);
  });

  it('turns a defeat into the opponent winning', () => {
    const defeat = { action: 'getDefeat', endType: 'game-end-lethal', gameType: 'CPU', golds: 5 };
    game.apply(connect());
    game.apply({ action: 'getUpdatePlayerHp', playerId: ME, hp: 0, maxHp: 30 });
    game.apply(defeat);
    expect(game.active).to.equal(false);
    expect(game.result).to.deep.include({ won: false });
    expect(game.result.reason).to.deep.equal({ key: 'game-end-lethal', text: 'Lethal' });
    expect(game.result.winner.username).to.equal('CPU');
    expect(game.result.loser.id).to.equal(ME);
    expect(game.result.loser.hp).to.equal(0);
    expect(game.result.data).to.equal(defeat);
  });

  it('turns a victory into the player winning', () => {
    game.apply(connect());
    game.apply({ action: 'getVictory', disconnected: false });
    expect(game.result).to.deep.include({ won: true });
    expect(game.result.winner.id).to.equal(ME);
    expect(game.result.loser.id).to.equal(THEM);
  });

  it('gives no reason for a victory the server does not explain', () => {
    game.apply(connect());
    game.apply({ action: 'getVictory', disconnected: false });
    expect(game.result.reason).to.equal(undefined);
  });

  it('reads a victory by disconnect', () => {
    game.apply(connect());
    game.apply({ action: 'getVictory', disconnected: true });
    expect(game.result.reason).to.deep.equal({ key: 'game-end-disconnection', text: 'Disconnection' });
  });

  it('reads a defeat by surrender', () => {
    game.apply(connect());
    game.apply({ action: 'getDefeat', endType: 'game-end-surrender' });
    expect(game.result.reason).to.deep.equal({ key: 'game-end-surrender', text: 'Surrender' });
  });

  it('looks the winner and loser of a plain result up by id', () => {
    const frame = { action: 'getResult', winner: THEM, looser: ME, cause: 'game-end-disconnection' };
    game.apply(connect());
    game.apply(frame);
    expect(game.result.won).to.equal(false);
    expect(game.result.reason.key).to.equal('game-end-disconnection');
    expect(game.result.winner.id).to.equal(THEM);
    expect(game.result.loser.id).to.equal(ME);
    expect(game.result.data).to.equal(frame);
  });

  it('announces the result once and keeps the first', () => {
    game.apply(connect());
    game.apply({ action: 'getDefeat' });
    game.apply({ action: 'getVictory' });
    const finished = seen.filter(([event]) => event === 'finished');
    expect(finished).to.have.length(1);
    expect(finished[0][1]).to.equal(game.result);
    expect(game.result.won).to.equal(false);
  });

  it('ignores actions it does not know', () => {
    game.apply(connect());
    game.apply({ action: 'getPlaySound', sound: 'x' });
    expect(seen).to.have.length(1);
  });

  it('lets the owner emit an event', () => {
    game.emit('turn', 4, true);
    expect(seen).to.deep.equal([['turn', 4, true]]);
  });

  it('forgets everything on reset', () => {
    game.apply(connect());
    game.reset();
    expect(game.active).to.equal(false);
    expect(game.player).to.equal(undefined);
    expect(game.slots).to.deep.equal([]);
  });
});
