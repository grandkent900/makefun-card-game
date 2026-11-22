// Ember Tide — bootstrap, input and the turn loop.
// Wires the engine, the AI and the renderer together; exposes a small
// window.__ember handle so automated play-tests can drive the real UI.

import { createGame, playCard, endTurn, describePlay, addLog } from './engine.js';
import { aiTakeTurn } from './ai.js';
import { renderAll, showEnd, hideEnd, showTitle, hideTitle } from './render.js';
import { shotTitle, shotPlay, shotWin, shotLoss } from './shots.js';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '20261123');
const shot = params.get('shot');
if (shot) document.body.classList.add('shot');

let game = null;
let lastPlayed = null;
let busy = false;

function refresh() {
  renderAll(game, lastPlayed, onPlayCard);
}

function finishIfOver() {
  if (game.over) {
    addLog(game, 'sys', game.winner === 'player'
      ? 'The Tidecaller falls. The ember tide is yours.'
      : 'Your last ember goes out.');
    refresh();
    showEnd(game);
    return true;
  }
  return false;
}

function onPlayCard(handIndex) {
  if (!game || game.over || game.turn !== 'player' || busy) return;
  const result = playCard(game, 'player', handIndex);
  if (!result) return;
  lastPlayed = result;
  addLog(game, 'you', describePlay('player', result));
  refresh();
  if (finishIfOver()) return;
}

async function onEndTurn() {
  if (!game || game.over || game.turn !== 'player' || busy) return;
  busy = true;
  lastPlayed = null;
  endTurn(game, 'player');
  addLog(game, 'sys', `Round ${game.round} — the Tidecaller takes the table.`);
  refresh();
  if (finishIfOver()) { busy = false; return; }
  await aiTakeTurn(game, {
    onRivalPlay(result) { lastPlayed = result; refresh(); },
  }, false);
  refresh();
  if (finishIfOver()) { busy = false; return; }
  endTurn(game, 'rival');
  addLog(game, 'sys', `Round ${game.round} — your turn. Energy refilled.`);
  refresh();
  busy = false;
}

function startDuel(freshSeed) {
  game = createGame(freshSeed === undefined ? (Date.now() % 2147483647) : freshSeed);
  lastPlayed = null;
  busy = false;
  hideEnd();
  hideTitle();
  refresh();
}

document.getElementById('startBtn').addEventListener('click', () => startDuel());
document.getElementById('againBtn').addEventListener('click', () => startDuel());
document.getElementById('endTurnBtn').addEventListener('click', onEndTurn);
document.addEventListener('keydown', (e) => {
  if (!game || game.over) return;
  if (e.key >= '1' && e.key <= '7') onPlayCard(Number(e.key) - 1);
  if (e.key === 'Enter') onEndTurn();
});

// Test hook: lets a headless play-test drive the same UI a human uses.
window.__ember = {
  get game() { return game; },
  start: startDuel,
  play: onPlayCard,
  endTurn: onEndTurn,
  state() {
    return game ? {
      over: game.over, winner: game.winner, round: game.round, turn: game.turn,
      playerHp: game.player.hp, rivalHp: game.rival.hp,
      playerHand: game.player.hand.length, rivalHand: game.rival.hand.length,
      playerEnergy: game.player.energy,
    } : null;
  },
};

async function boot() {
  if (shot === 'title') { shotTitle(); game = createGame(seed); refresh(); showTitle(); return; }
  if (shot === 'play') { game = await shotPlay(seed); lastPlayed = game.lastPlayed || lastPlayed; refresh(); return; }
  if (shot === 'win') { game = shotWin(seed); refresh(); return; }
  if (shot === 'loss') { game = shotLoss(seed); refresh(); return; }
  game = createGame(seed);
  refresh();
  showTitle();
}

boot();
