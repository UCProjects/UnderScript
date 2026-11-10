import game from 'src/structures/game/game';
import { debug } from 'src/utils/debug';

game.on('getTurnEnd getTurnStart getPlayableCards', function hideSpells() {
  // Remove stale cards
  const spells = $('.spellPlayed');
  if (spells.length) {
    spells.remove();
    debug(`(${this.event}) Removed spell`);
  }
});
