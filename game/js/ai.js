// Ember Tide — the Tidecaller's mind.
// A readable policy, so a player can learn it and counter it:
//   1. Take lethal when it is on the table.
//   2. When hurt, shore up: heal and block first.
//   3. Otherwise spend energy on the best value, chaining same-suit cards
//      for Resonance and saving Star cards to pair with each other.
// Every choice is explained in the duel log.

import { CARD_BY_ID, cardHeadline } from './cards.js';
import { canPlay, effectiveCost, playCard, describePlay, addLog } from './engine.js';

// Rough value of a card in the current position, for greedy ordering.
export function cardValue(game, fighter, def) {
  let v = 0;
  const foeHp = game.player.hp;
  if (def.dmg) {
    v += def.dmg * 2;
    if (def.dmg >= foeHp) v += 100; // lethal
  }
  if (def.heal) v += fighter.hp < 12 ? def.heal * 3 : def.heal;
  if (def.block) v += fighter.hp < 12 ? def.block * 2 : def.block;
  if (def.draw) v += def.draw * 2;
  if (def.starBonus && fighter.playedThisTurn.some((id) => CARD_BY_ID[id].suit === 'star')) v += def.starBonus * 2;
  if (def.cheapAfter && fighter.playedThisTurn.length >= def.cheapAfter) v += 2;
  if (fighter.lastSuit === def.suit) v += 3; // resonance chain
  return v / Math.max(1, effectiveCost(game, fighter, def));
}

function pickCard(game, fighter) {
  let best = -1;
  let bestValue = 0;
  for (let i = 0; i < fighter.hand.length; i++) {
    if (!canPlay(game, fighter, i)) continue;
    const def = CARD_BY_ID[fighter.hand[i]];
    const v = cardValue(game, fighter, def);
    if (v > bestValue) { bestValue = v; best = i; }
  }
  return best;
}

// One AI turn, played step by step with a pause between cards so the player
// can read each move. In instant mode (screenshots) the whole turn resolves
// at once. Returns the list of results.
export async function aiTakeTurn(game, hooks, instant) {
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  while (!game.over) {
    const i = pickCard(game, game.rival);
    if (i < 0) break;
    const result = playCard(game, 'rival', i);
    if (!result) break;
    results.push(result);
    addLog(game, 'rival', describePlay('rival', result));
    if (hooks && hooks.onRivalPlay) hooks.onRivalPlay(result);
    if (game.over) break;
    if (!instant) await sleep(650);
  }
  return results;
}

export { cardHeadline };
