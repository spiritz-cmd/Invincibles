/**
 * audit.cjs — data-quality audit for playerSeasons.ts
 * Flags:
 *   1. Same player name in same season under two different clubs (impossible)
 *   2. Same player id with different names (labelling inconsistency)
 *   3. Club-id hints that don't match the declared club (e.g. id contains 'chelsea' but club is 'Arsenal')
 *   4. Players whose id suffix hints at a specific known club that contradicts the listed club
 */
const fs = require('fs');
const src = fs.readFileSync('./src/data/playerSeasons.ts', 'utf8');

// Parse every row
const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)'\s*,\s*nationality:\s*'[^']*'\s*,\s*positions:\s*\[[^\]]+\]\s*,\s*season:\s*'([^']+)'\s*,\s*club:\s*'([^']+)'/g;
const rows = [];
let m;
while ((m = re.exec(src))) {
  rows.push({ id: m[1], name: m[2], season: m[3], club: m[4], line: src.slice(0, m.index).split('\n').length });
}

console.log(`Parsed ${rows.length} rows.\n`);

let issues = 0;

// ── 1. Same name + same season, different clubs ───────────────────────────────
const nameSeason = {};
for (const r of rows) {
  const k = r.name.toLowerCase() + '|' + r.season;
  if (!nameSeason[k]) nameSeason[k] = [];
  nameSeason[k].push(r);
}
let found1 = false;
for (const [k, rs] of Object.entries(nameSeason)) {
  const clubs = [...new Set(rs.map(r => r.club))];
  if (clubs.length > 1) {
    if (!found1) { console.log('── SAME NAME + SEASON, DIFFERENT CLUBS ──────────────────────────────'); found1 = true; }
    console.log(`  "${rs[0].name}" in ${rs[0].season}: ${clubs.join(' / ')}`);
    issues++;
  }
}
if (!found1) console.log('✓ No same-name/same-season club conflicts.');

// ── 2. Same id used for two different names ───────────────────────────────────
const idName = {};
for (const r of rows) {
  if (!idName[r.id]) idName[r.id] = new Set();
  idName[r.id].add(r.name);
}
let found2 = false;
for (const [id, names] of Object.entries(idName)) {
  if (names.size > 1) {
    if (!found2) { console.log('\n── SAME ID, DIFFERENT NAMES ─────────────────────────────────────────'); found2 = true; }
    console.log(`  id='${id}': ${[...names].join(' / ')}`);
    issues++;
  }
}
if (!found2) console.log('\n✓ No id/name conflicts.');

// ── 3. Id club-hint mismatches ────────────────────────────────────────────────
// Known club tokens that appear in ids → expected club substrings
const hints = [
  ['chelsea',    'Chelsea'],
  ['arsenal',    'Arsenal'],
  ['liverpool',  'Liverpool'],
  ['mancity',    'Manchester City'],
  ['manutd',     'Manchester United'],
  ['barcelona',  'Barcelona'],
  ['barca',      'Barcelona'],
  ['realmadrid', 'Real Madrid'],
  ['-rm-',       'Real Madrid'],
  ['juventus',   'Juventus'],
  ['bayernm',    'Bayern Munich'],
  ['psg',        'Paris Saint-Germain'],
  ['inter',      'Inter Milan'],
  ['atletico',   'Atletico Madrid'],
  ['dortmund',   'Borussia Dortmund'],
  ['shakhtar',   'Shakhtar Donetsk'],
  ['-sha-',      'Shakhtar Donetsk'],
  ['sha',        'Shakhtar Donetsk'],  // suffix like 'mudryk-sha'
];

let found3 = false;
for (const r of rows) {
  for (const [hint, expectedClub] of hints) {
    if (r.id.includes(hint) && !r.club.toLowerCase().includes(expectedClub.toLowerCase().split(' ')[0].toLowerCase())) {
      // Skip if the expected club is a partial match in the actual club
      if (r.club.toLowerCase().includes(expectedClub.toLowerCase().split(' ')[0])) continue;
      if (!found3) { console.log('\n── ID CLUB-HINT MISMATCHES ──────────────────────────────────────────'); found3 = true; }
      console.log(`  Line ${r.line}: id='${r.id}' (hints at ${expectedClub}) but club='${r.club}'  [${r.season}]`);
      issues++;
    }
  }
}
if (!found3) console.log('\n✓ No id/club hint mismatches.');

// ── 4. Known wrong-club patterns from batch writing errors ────────────────────
// Check if any non-trivial suffix like -cfr-, -besiktas-, -genk-, etc.
// appear under the wrong club
const suffixMap = [
  ['besiktas', 'Besiktas'],
  ['-cfr-', 'CFR Cluj'],
  ['-plzen-', 'Viktoria Plzen'],
  ['-sheriff-', 'Sheriff Tiraspol'],
  ['-genk-', 'Genk'],
  ['-rennes-', 'Rennes'],
  ['-fradi-', 'Ferencváros'],
  ['-krasnodar-', 'Krasnodar'],
  ['-basaksehir-', 'Istanbul Basaksehir'],
  ['-apoel-', 'APOEL'],
  ['-gladbach-', 'Mönchengladbach'],
  ['-twente-', 'Twente'],
  ['-brest-', 'Stade Brestois'],
  ['-girona-', 'Girona'],
  ['-bologna-', 'Bologna'],
  ['-slovan-', 'Slovan'],
  ['-qarabag-', 'Qarabag'],
  ['-partizan-', 'Partizan'],
  ['-rubin-', 'Rubin'],
];

let found4 = false;
for (const r of rows) {
  for (const [hint, expectedClub] of suffixMap) {
    if (r.id.includes(hint) && !r.club.toLowerCase().includes(expectedClub.toLowerCase().split(' ')[0].toLowerCase())) {
      if (!found4) { console.log('\n── SUFFIX/CLUB MISMATCHES ───────────────────────────────────────────'); found4 = true; }
      console.log(`  Line ${r.line}: id='${r.id}' (expects ${expectedClub}) but club='${r.club}'  [${r.season}]`);
      issues++;
    }
  }
}
if (!found4) console.log('\n✓ No suffix/club mismatches.');

console.log(`\n══ TOTAL ISSUES FLAGGED: ${issues} ══`);
