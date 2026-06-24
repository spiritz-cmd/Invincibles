/**
 * check.cjs — validate playerSeasons.ts
 * Checks: dup IDs, player count, and 11-balanced standard for all CL_CLUB_SEASONS pairs.
 * Run from project root: node scripts/check.cjs
 */
const fs = require('fs');
const path = require('path');

// ── Load rows from playerSeasons.ts ──────────────────────────────────────────
const rowsSrc = fs.readFileSync(path.join(__dirname, '../src/data/playerSeasons.ts'), 'utf8');
const rowRe = /\{\s*id:\s*'([^']+)',\s*name:\s*(?:'(?:[^'\\]|\\.)*'|"[^"]*"),\s*nationality:\s*(?:'[^']*'|"[^"]*"),\s*positions:\s*\[([^\]]+)\],\s*season:\s*'([^']+)',\s*club:\s*'([^']+)',\s*rating:\s*(\d+),\s*clApps:\s*(\d+)\s*\}/g;

const rows = [];
let m;
while ((m = rowRe.exec(rowsSrc))) {
  rows.push({
    id: m[1],
    positions: m[2].split(',').map(s => s.replace(/['\s]/g, '')).filter(Boolean),
    season: m[3],
    club: m[4],
    rating: Number(m[5]),
    clApps: Number(m[6]),
  });
}

// ── Dup IDs ───────────────────────────────────────────────────────────────────
// A player can appear multiple times (one row per season) — we check that each
// (id, season, club) triplet is unique (no exact duplicates).
const tripletSet = new Set();
const dupTriplets = [];
for (const r of rows) {
  const key = `${r.id}|${r.season}|${r.club}`;
  if (tripletSet.has(key)) dupTriplets.push(key);
  tripletSet.add(key);
}

const playerIds = [...new Set(rows.map(r => r.id))];
console.log(`TOTAL ROWS: ${rows.length}  PLAYERS: ${playerIds.length}  DUP TRIPLETS: ${dupTriplets.length}`);
if (dupTriplets.length) {
  console.error('DUPLICATE (id+season+club) triplets:');
  dupTriplets.forEach(d => console.error(' ', d));
}

// ── Load CL_CLUB_SEASONS ──────────────────────────────────────────────────────
const clSrc = fs.readFileSync(path.join(__dirname, '../src/data/clTable2526.ts'), 'utf8');
const csRe = /\{\s*club:\s*'([^']+)',\s*season:\s*'([^']+)'\s*\}/g;
const pairs = [];
while ((m = csRe.exec(clSrc))) pairs.push({ club: m[1], season: m[2] });
console.log(`CL_CLUB_SEASONS pairs: ${pairs.length}`);

// ── 11-balanced check ─────────────────────────────────────────────────────────
const bucket = pos => {
  const x = pos[0];
  if (x === 'GK') return 'GK';
  if (['CB','LB','RB','LWB','RWB'].includes(x)) return 'DEF';
  if (['DM','CM','AM','LM','RM'].includes(x)) return 'MID';
  return 'ATT';
};

const THRESHOLDS = { GK: 1, DEF: 4, MID: 3, ATT: 3 };

// Build a lookup: (club, season) → rows[]
const byPair = new Map();
for (const r of rows) {
  const key = `${r.club}|${r.season}`;
  if (!byPair.has(key)) byPair.set(key, []);
  byPair.get(key).push(r);
}

let failCount = 0;
const fails = [];
for (const { club, season } of pairs) {
  const list = byPair.get(`${club}|${season}`) || [];
  const c = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  list.forEach(r => c[bucket(r.positions)]++);
  const pass = c.GK >= THRESHOLDS.GK && c.DEF >= THRESHOLDS.DEF && c.MID >= THRESHOLDS.MID && c.ATT >= THRESHOLDS.ATT && list.length >= 11;
  if (!pass) {
    failCount++;
    fails.push(`FAIL ${club} ${season}: ${list.length} players  GK${c.GK} DEF${c.DEF} MID${c.MID} ATT${c.ATT}`);
  }
}

if (failCount === 0) {
  console.log(`11-balanced check: ALL ${pairs.length} pairs PASS ✓`);
} else {
  console.log(`11-balanced check: ${failCount} FAIL / ${pairs.length} pairs`);
  fails.forEach(f => console.log(' ', f));
}
