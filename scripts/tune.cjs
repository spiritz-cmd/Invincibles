// Tunes matchGoals() formula to hit the target 15-0-0 rates.
// Run: node scripts/tune.cjs

const CL_TEAMS = [
  95, 92, 91, 90, 90, 89, 88, 86, 85, 85, 83, 82, 82, 82,
  81, 81, 80, 79, 79, 79, 79, 78, 78, 77, 77, 77, 74, 72,
  72, 71, 70, 69, 66, 63, 62,
]

const TARGETS = {
  88: 1 / 800,
  90: 1 / 550,
  92: 1 / 350,
  95: 1 / 150,
  99: 1 / 10,
}

function poisson(lambda) {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

function matchGoals(a, b, BASE, DIV, MUL) {
  const diff = (a - b) / DIV
  const lA = Math.max(0.15, BASE + diff * MUL)
  const lB = Math.max(0.15, BASE - diff * MUL)
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
  const fixed = ids[0]
  let rot = ids.slice(1)
  const fixtures = []
  for (let r = 0; r < rounds; r++) {
    const round = [fixed, ...rot]
    for (let k = 0; k < n / 2; k++) fixtures.push([round[k], round[n - 1 - k]])
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)]
  }
  return fixtures
}

function run(userStrength, BASE, DIV, MUL) {
  const field = shuffle([
    { s: userStrength, isUser: true },
    ...CL_TEAMS.map(s => ({ s, isUser: false })),
  ])
  const n = field.length
  const st = field.map(t => ({ s: t.s, gf: 0, ga: 0, pts: 0, isUser: t.isUser }))

  let leagueWins = 0, leagueDraws = 0
  for (const [i, j] of leagueSchedule(n, 8)) {
    const [gi, gj] = matchGoals(field[i].s, field[j].s, BASE, DIV, MUL)
    st[i].gf += gi; st[i].ga += gj
    st[j].gf += gj; st[j].ga += gi
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
  let ki = 0
  const nextOpp = () => koPool[ki++ % koPool.length]

  let koWins = 0, koDraws = 0, totalKo = 0
  const playTie = (oppS) => {
    const [a1, b1] = matchGoals(userStrength, oppS, BASE, DIV, MUL)
    const [a2, b2] = matchGoals(userStrength, oppS, BASE, DIV, MUL)
    totalKo += 2
    if (a1 > b1) koWins++; else if (a1 === b1) koDraws++
    if (a2 > b2) koWins++; else if (a2 === b2) koDraws++
    const aggFor = a1 + a2, aggAgainst = b1 + b2
    if (aggFor === aggAgainst) return Math.random() < 0.5
    return aggFor < aggAgainst
  }

  const wentPlayoff = pos > 8
  if (wentPlayoff) { if (playTie((playoffPool[0] ?? nextOpp()).s)) return false }
  for (let r = 0; r < 3; r++) { if (playTie(nextOpp().s)) return false }

  const [gf, ga] = matchGoals(userStrength, nextOpp().s, BASE, DIV, MUL)
  totalKo++
  let wonFinal = gf > ga ? true : ga > gf ? false : Math.random() < 0.5
  if (!wonFinal) return false

  if (gf > ga) koWins++; else if (gf === ga) koDraws++

  const totalGames = 8 + totalKo
  const allWins = (leagueWins + koWins === totalGames) && leagueDraws === 0 && koDraws === 0
  return !wentPlayoff && totalGames === 15 && allWins
}

const RUNS = 60_000
const ovrs = [88, 90, 92, 95, 99]

const grid = []
for (const BASE of [0.85, 0.95, 1.05, 1.15]) {
  for (const DIV of [10, 12, 14, 17, 22]) {
    for (const MUL of [0.8, 1.0, 1.2, 1.5, 2.0]) {
      grid.push([BASE, DIV, MUL])
    }
  }
}

console.log(`Searching ${grid.length} parameter sets × ${RUNS.toLocaleString()} runs × ${ovrs.length} overalls...\n`)

let bestErr = Infinity, bestParams = null, bestRates = null

for (const [BASE, DIV, MUL] of grid) {
  const rates = {}
  for (const ovr of ovrs) {
    let hits = 0
    for (let i = 0; i < RUNS; i++) { if (run(ovr, BASE, DIV, MUL)) hits++ }
    rates[ovr] = hits / RUNS
  }
  // Log-space error
  let err = 0
  for (const ovr of ovrs) {
    const got = Math.max(rates[ovr], 1e-6)
    const want = TARGETS[ovr]
    err += (Math.log(got) - Math.log(want)) ** 2
  }
  if (err < bestErr) {
    bestErr = err
    bestParams = [BASE, DIV, MUL]
    bestRates = { ...rates }
    process.stdout.write(`  ✓ BASE=${BASE} DIV=${DIV} MUL=${MUL} → ${ovrs.map(o => `${o}:${(rates[o]*100).toFixed(3)}%`).join(' ')}\n`)
  }
}

console.log(`\n${'─'.repeat(60)}`)
console.log(`Best: BASE=${bestParams[0]} DIV=${bestParams[1]} MUL=${bestParams[2]}`)
console.log(`\n${'OVR'.padEnd(5)} ${'Target'.padStart(10)} ${'Got'.padStart(10)} ${'Ratio'.padStart(8)}`)
console.log('─'.repeat(36))
for (const ovr of ovrs) {
  const got = bestRates[ovr]
  const want = TARGETS[ovr]
  console.log(`${String(ovr).padEnd(5)} ${(want*100).toFixed(3).padStart(9)}% ${(got*100).toFixed(3).padStart(9)}% ${(got/want).toFixed(2).padStart(7)}x`)
}
