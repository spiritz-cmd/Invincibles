// Refined search — tighter grid, lower λ floor, wider MUL range.
// node scripts/tune2.cjs

const CL_TEAMS = [
  95, 92, 91, 90, 90, 89, 88, 86, 85, 85, 83, 82, 82, 82,
  81, 81, 80, 79, 79, 79, 79, 78, 78, 77, 77, 77, 74, 72,
  72, 71, 70, 69, 66, 63, 62,
]

const TARGETS = { 88: 1/800, 90: 1/550, 92: 1/350, 95: 1/150, 99: 1/10 }

function poisson(lambda) {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

function matchGoals(a, b, BASE, DIV, MUL, FLOOR) {
  const diff = (a - b) / DIV
  const lA = Math.max(FLOOR, BASE + diff * MUL)
  const lB = Math.max(FLOOR, BASE - diff * MUL)
  return [poisson(lA), poisson(lB)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function leagueSchedule(n, rounds) {
  const ids = Array.from({ length: n }, (_, i) => i)
  const fixed = ids[0]; let rot = ids.slice(1); const fixtures = []
  for (let r = 0; r < rounds; r++) {
    const round = [fixed, ...rot]
    for (let k = 0; k < n / 2; k++) fixtures.push([round[k], round[n - 1 - k]])
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)]
  }
  return fixtures
}

function run(userStrength, BASE, DIV, MUL, FLOOR) {
  const field = shuffle([{ s: userStrength, isUser: true }, ...CL_TEAMS.map(s => ({ s, isUser: false }))])
  const n = field.length
  const st = field.map(t => ({ s: t.s, gf: 0, ga: 0, pts: 0, isUser: t.isUser }))

  let leagueWins = 0, leagueDraws = 0
  for (const [i, j] of leagueSchedule(n, 8)) {
    const [gi, gj] = matchGoals(field[i].s, field[j].s, BASE, DIV, MUL, FLOOR)
    st[i].gf += gi; st[i].ga += gj; st[j].gf += gj; st[j].ga += gi
    if (gi > gj) st[i].pts += 3; else if (gj > gi) st[j].pts += 3; else { st[i].pts++; st[j].pts++ }
    if (field[i].isUser || field[j].isUser) {
      const gf = field[i].isUser ? gi : gj, ga = field[i].isUser ? gj : gi
      if (gf > ga) leagueWins++; else if (gf === ga) leagueDraws++
    }
  }
  st.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  const pos = st.findIndex(s => s.isUser) + 1
  if (pos > 24) return false

  const others = st.filter(s => !s.isUser)
  const playoffPool = shuffle(others.slice(8, 24))
  const koPool = shuffle(others.slice(0, 16))
  let ki = 0; const nextOpp = () => koPool[ki++ % koPool.length]

  let koWins = 0, koDraws = 0, totalKo = 0
  const playTie = (oppS) => {
    const [a1, b1] = matchGoals(userStrength, oppS, BASE, DIV, MUL, FLOOR)
    const [a2, b2] = matchGoals(userStrength, oppS, BASE, DIV, MUL, FLOOR)
    totalKo += 2
    if (a1 > b1) koWins++; else if (a1 === b1) koDraws++
    if (a2 > b2) koWins++; else if (a2 === b2) koDraws++
    const agg = a1 + a2 - b1 - b2
    if (agg === 0) return Math.random() < 0.5
    return agg < 0
  }

  const wentPlayoff = pos > 8
  if (wentPlayoff) { if (playTie((playoffPool[0] ?? nextOpp()).s)) return false }
  for (let r = 0; r < 3; r++) { if (playTie(nextOpp().s)) return false }

  const [gf, ga] = matchGoals(userStrength, nextOpp().s, BASE, DIV, MUL, FLOOR)
  totalKo++
  const wonFinal = gf > ga ? true : ga > gf ? false : Math.random() < 0.5
  if (!wonFinal) return false
  if (gf > ga) koWins++; else if (gf === ga) koDraws++

  const totalGames = 8 + totalKo
  const allWins = leagueWins + koWins === totalGames && leagueDraws === 0 && koDraws === 0
  return !wentPlayoff && totalGames === 15 && allWins
}

const RUNS = 80_000
const ovrs = [88, 90, 92, 95, 99]

// Denser grid in the promising region
const grid = []
for (const BASE of [0.8, 0.9, 1.0, 1.1]) {
  for (const DIV of [7, 9, 11, 13, 16]) {
    for (const MUL of [1.0, 1.3, 1.6, 2.0, 2.5]) {
      for (const FLOOR of [0.05, 0.1, 0.15]) {
        grid.push([BASE, DIV, MUL, FLOOR])
      }
    }
  }
}

console.log(`Searching ${grid.length} sets × ${RUNS.toLocaleString()} runs × ${ovrs.length} overalls...\n`)

let bestErr = Infinity, bestParams = null, bestRates = null

for (const [BASE, DIV, MUL, FLOOR] of grid) {
  const rates = {}
  for (const ovr of ovrs) {
    let hits = 0
    for (let i = 0; i < RUNS; i++) { if (run(ovr, BASE, DIV, MUL, FLOOR)) hits++ }
    rates[ovr] = hits / RUNS
  }
  let err = 0
  for (const ovr of ovrs) {
    const got = Math.max(rates[ovr], 1e-7)
    const want = TARGETS[ovr]
    err += (Math.log(got) - Math.log(want)) ** 2
  }
  if (err < bestErr) {
    bestErr = err; bestParams = [BASE, DIV, MUL, FLOOR]; bestRates = { ...rates }
    const tag = `BASE=${BASE} DIV=${DIV} MUL=${MUL} FLOOR=${FLOOR}`
    process.stdout.write(`  ✓ ${tag} → ${ovrs.map(o => `${o}:${(rates[o]*100).toFixed(3)}%`).join(' ')}\n`)
  }
}

console.log(`\n${'─'.repeat(70)}`)
const [B, D, M, F] = bestParams
console.log(`Best: BASE=${B} DIV=${D} MUL=${M} FLOOR=${F}\n`)
console.log(`${'OVR'.padEnd(5)} ${'Target'.padStart(10)} ${'Got'.padStart(10)} ${'Ratio'.padStart(8)}`)
console.log('─'.repeat(36))
for (const ovr of ovrs) {
  const got = bestRates[ovr], want = TARGETS[ovr]
  console.log(`${String(ovr).padEnd(5)} ${(want*100).toFixed(3).padStart(9)}% ${(got*100).toFixed(3).padStart(9)}% ${(got/want).toFixed(2).padStart(7)}x`)
}
