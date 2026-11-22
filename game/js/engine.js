// Ember Tide — duel engine: state, turns, combat, resonance combos, win/loss.
// Pure logic, no DOM: the renderer and the AI both drive this module.

import { CARD_BY_ID, buildDeck, makeRng, shuffle } from './cards.js';

export const MAX_HP = 30;
export const HAND_LIMIT = 7;

export function newFighter(deckIds) {
  return {
    hp: MAX_HP, block: 0, energy: 0, energyNext: 0,
    deck: deckIds.slice(), hand: [], discard: [],
    playedThisTurn: [], lastSuit: null, damageDealt: 0, cardsPlayed: 0,
  };
}

export function createGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed, rng, round: 1, turn: 'player', over: false, winner: null,
    log: [],
    player: newFighter(shuffle(buildDeck(), rng)),
    rival: newFighter(shuffle(buildDeck(), rng)),
  };
  drawCards(game, game.player, 4);
  drawCards(game, game.rival, 4);
  beginTurn(game, game.player);
  addLog(game, 'sys', 'The duel begins. You hold the first turn.');
  return game;
}

// Energy grows as the duel goes on: 3 + one more every two rounds, capped at 6.
export function energyForRound(round) {
  return Math.min(3 + Math.floor((round - 1) / 2), 6);
}

export function drawCards(game, fighter, n) {
  for (let i = 0; i < n; i++) {
    if (fighter.hand.length >= HAND_LIMIT) break;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) break;
      fighter.deck = shuffle(fighter.discard, game.rng);
      fighter.discard = [];
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

export function beginTurn(game, fighter) {
  const drain = fighter.energyNext;
  fighter.energyNext = 0;
  fighter.energy = Math.max(0, energyForRound(game.round) - drain);
  fighter.block = 0;
  fighter.playedThisTurn = [];
  fighter.lastSuit = null;
  drawCards(game, fighter, 2);
}

// Nova Pact costs 1 less once 2+ cards have been played this turn.
export function effectiveCost(game, fighter, def) {
  if (def.cheapAfter && fighter.playedThisTurn.length >= def.cheapAfter) {
    return Math.max(0, def.cost - 1);
  }
  return def.cost;
}

export function canPlay(game, fighter, handIndex) {
  const def = CARD_BY_ID[fighter.hand[handIndex]];
  if (!def) return false;
  return fighter.energy >= effectiveCost(game, fighter, def);
}

function applyDamage(game, target, amount, source) {
  let left = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, left);
    target.block -= absorbed;
    left -= absorbed;
  }
  target.hp = Math.max(0, target.hp - left);
  source.damageDealt += left;
  return left;
}

// Resonance: a card whose suit matches the previous card played this turn
// gains +2 to its damage or its heal.
function resonanceBonus(fighter, def) {
  if (fighter.lastSuit && fighter.lastSuit === def.suit && (def.dmg || def.heal)) return 2;
  return 0;
}

// Plays hand[handIndex] for `side` ('player' | 'rival'). Returns a result
// object describing what happened, or null when the play is illegal.
export function playCard(game, side, handIndex) {
  if (game.over) return null;
  const me = game[side];
  const foe = game[side === 'player' ? 'rival' : 'player'];
  const cardId = me.hand[handIndex];
  if (cardId === undefined) return null;
  const def = CARD_BY_ID[cardId];
  const cost = effectiveCost(game, me, def);
  if (me.energy < cost) return null;

  me.energy -= cost;
  me.hand.splice(handIndex, 1);
  me.discard.push(cardId);
  me.cardsPlayed += 1;

  const res = resonanceBonus(me, def);
  const starBonus = def.starBonus && me.playedThisTurn.some((id) => CARD_BY_ID[id].suit === 'star') ? def.starBonus : 0;
  const dmg = (def.dmg || 0) + res + starBonus;
  const heal = (def.heal || 0) + (def.dmg ? 0 : res);
  const result = { card: def, cost, resonance: res, starBonus, dmg, heal, block: def.block || 0, draw: def.draw || 0, drain: def.drain || 0, dealt: 0, blocked: 0 };

  if (dmg > 0) result.dealt = applyDamage(game, foe, dmg, me);
  result.blocked = dmg - result.dealt;
  if (heal > 0) me.hp = Math.min(MAX_HP, me.hp + heal);
  if (def.block) me.block += def.block;
  if (def.draw) drawCards(game, me, def.draw);
  if (def.drain) foe.energyNext += def.drain;
  if (def.discardSelf) {
    for (let i = 0; i < def.discardSelf && me.hand.length > 0; i++) {
      const j = Math.floor(game.rng() * me.hand.length);
      me.discard.push(me.hand.splice(j, 1)[0]);
    }
  }

  me.playedThisTurn.push(cardId);
  me.lastSuit = def.suit;
  checkEnd(game);
  return result;
}

export function endTurn(game, side) {
  if (game.over) return;
  if (side === 'player') {
    game.turn = 'rival';
    beginTurn(game, game.rival);
  } else {
    game.turn = 'player';
    game.round += 1;
    beginTurn(game, game.player);
  }
}

function checkEnd(game) {
  if (game.rival.hp <= 0) { game.over = true; game.winner = 'player'; }
  else if (game.player.hp <= 0) { game.over = true; game.winner = 'rival'; }
}

export function addLog(game, who, text) {
  game.log.push({ who, text });
  if (game.log.length > 60) game.log.shift();
}

export function describePlay(side, result) {
  const bits = [];
  const d = result.card;
  if (result.dmg > 0) bits.push(result.blocked > 0 ? `deals ${result.dmg} damage (${result.blocked} blocked)` : `deals ${result.dealt} damage`);
  if (result.heal > 0) bits.push(`heals ${result.heal}`);
  if (result.block > 0) bits.push(`gains ${result.block} Block`);
  if (result.draw > 0) bits.push(`draws ${result.draw}`);
  if (result.drain > 0) bits.push(`binds the foe (-${result.drain} energy)`);
  if (result.resonance > 0) bits.push(`Resonance +${result.resonance}`);
  if (result.starBonus > 0) bits.push(`Twin Stars +${result.starBonus}`);
  return `${side === 'player' ? 'You play' : 'Rival plays'} ${d.name} (${d.cost} energy) — ${bits.join(', ') || 'nothing happens'}.`;
}
