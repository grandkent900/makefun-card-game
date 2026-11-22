# Ember Tide — a duel of fire and water

[![Ember Tide](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/grandkent900/makefun-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/grandkent900/makefun-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

An original card game for the [best-card-game-20261122-1826](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) bounty on make.fun.

## The game

You are the **Emberkeeper**, duelling the AI **Tidecaller** across a table of
fire and water. Both duelists have 30 HP. Each turn you draw cards, spend
energy to play them, and try to burn the Tidecaller to 0 HP before she
drowns your last ember.

- **Four suits, told apart by colour and shape**: ▲ Ember burns,
  ● Tide draws and binds, ◆ Leaf heals and shields, ★ Star combos.
- **Resonance**: play two cards of the same suit in a row and the second
  gains +2 damage or healing — chaining is the heart of every hand.
- **Star combos**: Twin Stars hits harder after another Star card, Nova Pact
  costs less once you have played twice, Comet hits hardest but costs you
  a card.
- **A readable rival**: the Tidecaller takes lethal when she sees it,
  shores up with heals and Block when hurt, and otherwise spends energy on
  the best value — every move is explained in the duel log, so you can
  read her and counter her.
- Energy grows as the duel goes on (3, then +1 every two rounds, up to 6).

## How to play

Open `game/index.html` in a desktop browser — pure static files, no build
step, no network requests. Click a card to play it (keys 1–7 work too),
press **END TURN** (or Enter) to hand the table to the Tidecaller.

`?shot=title|play|win|loss&seed=N` renders a deterministic scene of the
game, used to take the screenshots in `screenshots/`.

## Files

- `game/index.html` — the table
- `game/css/table.css` — table, cards and overlays (all art is CSS)
- `game/js/cards.js` — the 16-card catalogue, decks and seeded RNG
- `game/js/engine.js` — duel state, turns, combat and Resonance
- `game/js/ai.js` — the Tidecaller's readable policy
- `game/js/render.js` — DOM rendering of the table and cards
- `game/js/shots.js` — deterministic screenshot scenes
- `game/js/main.js` — bootstrap, input and the turn loop
- `main.ts` — hands `game/` and `screenshots/` in with a dossier
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
