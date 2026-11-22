// Ember Tide — card catalogue, suits and decks.
// Every card is an original design for this game: four suits, each with a
// colour AND a shape glyph, so suits are told apart by more than text.

export const SUITS = {
  ember: { name: 'Ember', glyph: '▲', art: '🔥', color: '#e63946', blurb: 'burns' },
  tide: { name: 'Tide', glyph: '●', art: '🌊', color: '#4361ee', blurb: 'draws & binds' },
  leaf: { name: 'Leaf', glyph: '◆', art: '🍃', color: '#2a9d8f', blurb: 'heals & shields' },
  star: { name: 'Star', glyph: '★', art: '✨', color: '#b08900', blurb: 'combos' },
};

// effect kinds: dmg (damage), heal, block, draw, drain (foe loses energy next turn),
// discardSelf (discard a random card from your own hand after playing).
export const CARD_DEFS = [
  { id: 'spark', name: 'Spark', suit: 'ember', cost: 1, dmg: 3, text: 'Deal 3 damage.' },
  { id: 'lash', name: 'Flame Lash', suit: 'ember', cost: 2, dmg: 5, text: 'Deal 5 damage.' },
  { id: 'inferno', name: 'Inferno', suit: 'ember', cost: 3, dmg: 8, text: 'Deal 8 damage.' },
  { id: 'fan', name: 'Cinder Fan', suit: 'ember', cost: 2, dmg: 3, draw: 1, text: 'Deal 3 damage. Draw 1.' },
  { id: 'surge', name: 'Surge', suit: 'tide', cost: 1, draw: 2, text: 'Draw 2 cards.' },
  { id: 'riptide', name: 'Riptide', suit: 'tide', cost: 2, dmg: 4, text: 'Deal 4 damage.' },
  { id: 'current', name: 'Deep Current', suit: 'tide', cost: 2, draw: 1, heal: 3, text: 'Draw 1. Heal 3 HP.' },
  { id: 'frost', name: 'Frostbind', suit: 'tide', cost: 3, dmg: 6, drain: 2, text: 'Deal 6 damage. Foe −2 energy.' },
  { id: 'mend', name: 'Mend', suit: 'leaf', cost: 1, heal: 4, text: 'Heal 4 HP.' },
  { id: 'bark', name: 'Barkwall', suit: 'leaf', cost: 1, block: 6, text: 'Gain 6 Block.' },
  { id: 'grove', name: 'Grove Song', suit: 'leaf', cost: 2, heal: 6, draw: 1, text: 'Heal 6 HP. Draw 1.' },
  { id: 'thorn', name: 'Thornsnare', suit: 'leaf', cost: 2, dmg: 3, block: 3, text: 'Deal 3 damage. Gain 3 Block.' },
  { id: 'starlight', name: 'Starlight', suit: 'star', cost: 1, draw: 1, heal: 2, text: 'Draw 1 card. Heal 2 HP.' },
  { id: 'twin', name: 'Twin Stars', suit: 'star', cost: 2, dmg: 4, starBonus: 3, text: 'Deal 4 damage. +3 after a Star.' },
  { id: 'nova', name: 'Nova Pact', suit: 'star', cost: 3, dmg: 7, cheapAfter: 2, text: 'Deal 7 damage. −1 after 2 plays.' },
  { id: 'comet', name: 'Comet', suit: 'star', cost: 3, dmg: 9, discardSelf: 1, text: 'Deal 9 damage. Discard 1 card.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((c) => [c.id, c]));

// A deck is two copies of every card: 32 cards. Both duelists use the same pool.
export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) deck.push(def.id, def.id);
  return deck;
}

// Deterministic RNG (mulberry32) so screenshot scenes replay exactly.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// The big number a card shows: its damage, or its heal/block when it has none.
export function cardHeadline(def) {
  if (def.dmg) return { num: def.dmg, label: 'DMG' };
  if (def.heal) return { num: def.heal, label: 'HEAL' };
  if (def.block) return { num: def.block, label: 'BLOCK' };
  return { num: def.draw, label: 'DRAW' };
}
