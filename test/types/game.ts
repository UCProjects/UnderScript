import type { GameCommand } from 'src/types/game/commands';
import type { GameBattleLog, GameCard, GamePlayer } from 'src/types/game/entities';
import type { GameEvent, GameEvents } from 'src/types/game/events';
import type { GameEventUnseen } from 'src/types/game/events.unseen';
import type { GameBypassEvent, GameQueuedEvent } from 'src/types/game/queue';
import type { JsonString, Parsed } from 'src/types/game/wire';

declare const event: GameEvent;
declare const unseen: GameEventUnseen;
declare const command: GameCommand;
declare const card: JsonString<GameCard>;
declare const log: GameBattleLog;
declare const bypassed: GameBypassEvent;
declare const queued: GameQueuedEvent;

switch (event.action) {
  case 'getTurnStart':
    event.numTurn satisfies number;
    break;
  case 'updateCard':
    event.card satisfies string;
    // @ts-expect-error the card is still text until it is parsed
    event.card.owner;
    (JSON.parse(event.card) as Parsed<typeof event.card>).owner satisfies GamePlayer;
    break;
  case 'getPlayersStats':
    event.artifacts satisfies JsonString<Record<string, unknown[]>>;
    break;
  case 'getTempCancel':
    // @ts-expect-error this event carries nothing else
    event.hand;
    break;
  default:
}

switch (unseen.action) {
  case 'getShowCard':
    unseen.waitTime satisfies number;
    break;
  default:
}

switch (command.action) {
  case 'playMonster':
    command.x satisfies string;
    // @ts-expect-error the server ignores numbers
    command.x satisfies number;
    break;
  case 'mulligan':
    command.ids satisfies string[];
    break;
  default:
}

switch (log.battleLogType) {
  case 'SOUL_EFFECT':
    log.playerActor satisfies GamePlayer;
    break;
  case 'ATTACK_MONSTER':
    log.cardActor satisfies GameCard;
    // @ts-expect-error a card log has no player actor
    log.playerActor;
    break;
  default:
}

bypassed.action satisfies
  | 'connect'
  | 'getEmote'
  | 'getError'
  | 'getGameError'
  | 'getGameRemoved'
  | 'getHideMulligan'
  | 'getShowMulligan';
// @ts-expect-error a queued event is never one that skips the queue
queued.action satisfies 'connect';

card satisfies string;
// @ts-expect-error plain text is not a parsed card
'{}' satisfies JsonString<GameCard>;

const parsed: Parsed<GameEvents['getUpdateHand']> = { hand: [] };
parsed.hand satisfies GameCard[];

export {};
