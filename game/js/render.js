// Ember Tide — DOM rendering: table, hands, cards, log and end screens.
// All visuals are DOM/CSS; no images are loaded anywhere.

import { CARD_BY_ID, SUITS, cardHeadline } from './cards.js';
import { effectiveCost, MAX_HP } from './engine.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

export function cardElement(game, fighter, handIndex, playable, onClick) {
  const def = CARD_BY_ID[fighter.hand[handIndex]];
  const suit = SUITS[def.suit];
  const head = cardHeadline(def);
  const card = el('div', `card suit-${def.suit}`);
  if (!playable) card.classList.add('unplayable');
  card.dataset.cardId = def.id;

  const top = el('div', 'card-top');
  top.appendChild(el('div', 'cost', String(effectiveCost(game, fighter, def))));
  top.appendChild(el('div', 'suit-glyph', suit.glyph));
  card.appendChild(top);
  card.appendChild(el('div', 'card-name', def.name));
  card.appendChild(el('div', 'card-art', suit.art));
  const value = el('div', 'card-value', String(head.num));
  value.appendChild(el('small', null, ` ${head.label}`));
  card.appendChild(value);
  card.appendChild(el('div', 'card-text', def.text));
  card.appendChild(el('div', 'card-suit', `${suit.glyph} ${suit.name}`));
  card.appendChild(el('div', 'key', String(handIndex + 1)));
  if (onClick) card.addEventListener('click', () => onClick(handIndex));
  return card;
}

export function renderFighter(prefix, fighter) {
  const hpFill = document.getElementById(`${prefix}HpFill`);
  const hpText = document.getElementById(`${prefix}HpText`);
  hpFill.style.width = `${(fighter.hp / MAX_HP) * 100}%`;
  hpText.textContent = `${fighter.hp} / ${MAX_HP}`;
  document.getElementById(`${prefix}Energy`).textContent = fighter.energy;
  document.getElementById(`${prefix}Block`).textContent = fighter.block;
  document.getElementById(`${prefix}Deck`).textContent = fighter.deck.length;
  const discard = document.getElementById(`${prefix}Discard`);
  if (discard) discard.textContent = fighter.discard.length;
}

export function renderRivalHand(game) {
  const hand = document.getElementById('rivalHand');
  hand.replaceChildren();
  for (let i = 0; i < game.rival.hand.length; i++) {
    const back = el('div', 'card-back', '●');
    hand.appendChild(back);
  }
}

export function renderPlayerHand(game, onPlay) {
  const hand = document.getElementById('playerHand');
  hand.replaceChildren();
  game.player.hand.forEach((_, i) => {
    const playable = game.turn === 'player' && !game.over && onPlay !== null;
    hand.appendChild(cardElement(game, game.player, i, playable, onPlay));
  });
}

export function renderLog(game) {
  const log = document.getElementById('log');
  log.replaceChildren();
  for (const entry of game.log) {
    log.appendChild(el('div', entry.who, entry.text));
  }
  log.scrollTop = log.scrollHeight;
}

export function renderStage(game, lastPlayed) {
  const zone = document.getElementById('playedZone');
  zone.replaceChildren();
  if (lastPlayed) {
    const ghost = cardElement(game, { hand: [lastPlayed.card.id], playedThisTurn: [] }, 0, false, null);
    ghost.classList.add('played-anim');
    ghost.style.cursor = 'default';
    zone.appendChild(ghost);
  } else {
    zone.appendChild(el('span', 'played-hint', 'Played cards appear here'));
  }
  const res = document.getElementById('resonance');
  const p = game.player, r = game.rival;
  const chain = [];
  if (p.lastSuit) chain.push(`You: ${SUITS[p.lastSuit].glyph} ${SUITS[p.lastSuit].name} chain`);
  if (r.lastSuit) chain.push(`Rival: ${SUITS[r.lastSuit].glyph} ${SUITS[r.lastSuit].name} chain`);
  res.textContent = chain.length ? `Resonance chain — ${chain.join(' · ')} (same suit twice: +2)` : '';
}

export function renderAll(game, lastPlayed, onPlay) {
  document.getElementById('roundInfo').textContent = `Round ${game.round}`;
  document.getElementById('turnInfo').textContent =
    game.over ? (game.winner === 'player' ? 'You win!' : 'The Tidecaller wins')
    : game.turn === 'player' ? 'Your turn — play a card' : 'Rival is thinking…';
  renderFighter('player', game.player);
  renderFighter('rival', game.rival);
  renderRivalHand(game);
  renderPlayerHand(game, game.turn === 'player' && !game.over ? onPlay : null);
  renderLog(game);
  renderStage(game, lastPlayed);
  document.getElementById('endTurnBtn').disabled = game.turn !== 'player' || game.over;
}

export function showEnd(game) {
  const screen = document.getElementById('endScreen');
  const title = document.getElementById('endTitle');
  const text = document.getElementById('endText');
  const stats = document.getElementById('endStats');
  const won = game.winner === 'player';
  title.textContent = won ? '★ VICTORY ★' : 'DEFEAT';
  title.className = won ? 'win' : 'loss';
  text.textContent = won
    ? 'The Tidecaller bows. The ember tide is yours — the table is won.'
    : 'The tide closes over the last ember. The Tidecaller takes the table.';
  stats.replaceChildren();
  const p = game.player;
  const cells = [
    ['Rounds', game.round],
    ['Damage dealt', p.damageDealt],
    ['Cards played', p.cardsPlayed],
    ['Your HP', `${p.hp} / ${MAX_HP}`],
  ];
  for (const [label, value] of cells) {
    const cell = el('div', null);
    cell.appendChild(el('div', null, label));
    cell.appendChild(el('b', null, String(value)));
    stats.appendChild(cell);
  }
  screen.classList.remove('hidden');
}

export function hideEnd() {
  document.getElementById('endScreen').classList.add('hidden');
}

export function showTitle() {
  document.getElementById('titleScreen').classList.remove('hidden');
}

export function hideTitle() {
  document.getElementById('titleScreen').classList.add('hidden');
}
