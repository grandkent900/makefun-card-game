// Ember Tide — deterministic screenshot scenes.
// ?shot=title|play|win|loss&seed=N renders a fixed table state synchronously,
// so the screenshots are real renders of the game's own code, replayable.

import { createGame, playCard, endTurn, describePlay, addLog } from './engine.js';
import { aiTakeTurn } from './ai.js';
import { showTitle, hideTitle, showEnd } from './render.js';

// A scripted mid-game: fixed seed, a few real plays by both sides, so the
// table shows played cards, a log, damage taken and both hands.
export async function shotPlay(seed) {
  const game = createGame(seed);
  // Player opens with the two cheapest playable cards in hand, in order.
  for (let step = 0; step < 2 && !game.over; step++) {
    const i = game.player.hand.findIndex((_, k) => {
      const r = playCard(game, 'player', k);
      if (r) { addLog(game, 'you', describePlay('player', r)); return true; }
      return false;
    });
    if (i < 0) break;
  }
  if (!game.over) {
    endTurn(game, 'player');
    await aiTakeTurn(game, null, true);
    if (!game.over) endTurn(game, 'rival');
  }
  // One more player play so the stage shows a fresh card on the table.
  if (!game.over) {
    for (let k = 0; k < game.player.hand.length; k++) {
      const r = playCard(game, 'player', k);
      if (r) { addLog(game, 'you', describePlay('player', r)); game.lastPlayed = r; break; }
    }
  }
  hideTitle();
  return game;
}

export function shotWin(seed) {
  const game = createGame(seed);
  game.rival.hp = 0;
  game.over = true;
  game.winner = 'player';
  game.player.damageDealt = 30;
  game.player.cardsPlayed = 9;
  game.round = 5;
  addLog(game, 'you', 'You play Inferno (3 energy) — deals 8 damage.');
  addLog(game, 'sys', 'The Tidecaller falls. The ember tide is yours.');
  hideTitle();
  showEnd(game);
  return game;
}

export function shotLoss(seed) {
  const game = createGame(seed);
  game.player.hp = 0;
  game.over = true;
  game.winner = 'rival';
  game.rival.damageDealt = 30;
  game.player.cardsPlayed = 7;
  game.round = 6;
  addLog(game, 'rival', 'Rival plays Riptide (2 energy) — deals 4 damage.');
  addLog(game, 'sys', 'Your last ember goes out.');
  hideTitle();
  showEnd(game);
  return game;
}

export function shotTitle() {
  showTitle();
  return null;
}
