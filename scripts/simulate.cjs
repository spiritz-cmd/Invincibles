// Standalone simulation — mirrors simulation.ts exactly, no TS imports needed.
// Run: node scripts/simulate.cjs

const CL_TEAMS = [
  { name: 'Real Madrid', s: 95 },
  { name: 'Manchester City', s: 92 },
  { name: 'Bayern Munich', s: 91 },
  { name: 'Paris Saint-Germain', s: 90 },
  { name: 'Barcelona', s: 90 },
  { name: 'Liverpool', s: 89 },
  { name: 'Arsenal', s: 88 },
  { name: 'Inter Milan', s: 86 },
  { name: 'Atletico Madrid', s: 85 },
  { name: 'Chelsea', s: 85 },
  { name: 'Borussia Dortmund', s: 83 },
  { name: 'Bayer Leverkusen', s: 82 },
  { name: 'Juventus', s: 82 },
  { name: 'Napoli', s: 82 },
  { name: 'Atalanta', s: 81 },
  { name: 'Newcastle United', s: 81 },
  { name: 'Benfica', s: 80 },
  { name: 'Sporting CP', s: 79 },
  { name: 'Villarreal', s: 79 },
  { name: 'Eintracht Frankfurt', s: 79 },
  { name: 'Marseille', s: 79 },
  { name: 'Athletic Club', s: 78 },
  { name: 'Monaco', s: 78 },
  { name: 'PSV Eindhoven', s: 77 },
  { name: 'Ajax', s: 77 },
  { name: 'Galatasaray', s: 77 },
  { name: 'Club Brugge', s: 74 },
  { name: 'Olympiacos', s: 72 },
  { name: 'Union Saint-Gilloise', s: 72 },
  { name: 'Copenhagen', s: 71 },
  { name: 'Slavia Prague', s: 70 },
  { name: 'Bodo/Glimt', s: 69 },
  { name: 'Qarabag', s: 66 },
  { name: 'Pafos', s: 63 },
  { name: 'Kairat Almaty', s: 62 },
]

function poisson(lambda) {
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

function matchGoals(a, b) {
  const diff = (a - b) / 22
  const lA = Math.max(0.15, 0.95 + diff * 2)
  const lB = Math.max(0.15, 0.95 - diff * 2)
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

// Returns { won, perfect15, position, points, leagueWins, leagueDraws, koWins, koDraws, wentPlayoff }
function simulate(userStrength) {
  const field = shuffle([
    { s: userStrength, isUser: true },
    ...CL_TEAMS.map(t => ({ s: t.s, isUser: false })),
  ])
  const n = field.length
  const st = field.map(t => ({ s: t.s, gf: 0, ga: 0, pts: 0, isUser: t.isUser }))

  let leagueWins = 0, leagueDraws = 0
  for (const [i, j] of leagueSchedule(n, 8)) {
    const [gi, gj] = matchGoals(field[i].s, field[j].s)
    st[i].gf += gi; st[i].ga += gj
    st[j].gf += gj; st[j].ga += gi
    if (gi > gj) st[i].pts += 3
    else if (gj > gi) st[j].pts += 3
    else { st[i].pts++; st[j].pts++ }

    if (field[i].isUser || field[j].isUser) {
      const gf = field[i].isUser ? gi : gj
      const ga = field[i].isUser ? gj : gi
      if (gf > ga) leagueWins++
      else if (gf === ga) leagueDraws++
    }
  }

  st.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  const pos = st.findIndex(s => s.isUser) + 1
  const pts = st[pos - 1].pts

  if (pos > 24) return { won: false, perfect15: false, position: pos, points: pts, leagueWins, leagueDraws, koWins: 0, koDraws: 0, wentPlayoff: false }

  const others = st.filter(s => !s.isUser)
  const playoffPool = shuffle(others.slice(8, 24))
  const koPool = shuffle(others.slice(0, 16))
  let ki = 0
  const nextOpp = () => koPool[ki++ % koPool.length]

  let koWins = 0, koDraws = 0, totalKoGames = 0

  const playTie = (oppStrength) => {
    const [a1, b1] = matchGoals(userStrength, oppStrength)
    const [a2, b2] = matchGoals(userStrength, oppStrength)
    totalKoGames += 2
    // Track individual game results
    if (a1 > b1) koWins++; else if (a1 === b1) koDraws++
    if (a2 > b2) koWins++; else if (a2 === b2) koDraws++
    const aggFor = a1 + a2, aggAgainst = b1 + b2
    if (aggFor === aggAgainst) return Math.random() < 0.5 // coin flip = loss for us 50%
    return aggFor < aggAgainst
  }

  const wentPlayoff = pos > 8
  if (wentPlayoff) {
    const opp = playoffPool[0] ?? nextOpp()
    if (playTie(opp.s)) return { won: false, perfect15: false, position: pos, points: pts, leagueWins, leagueDraws, koWins, koDraws, wentPlayoff }
  }

  for (let r = 0; r < 3; r++) {
    if (playTie(nextOpp().s)) return { won: false, perfect15: false, position: pos, points: pts, leagueWins, leagueDraws, koWins, koDraws, wentPlayoff }
  }

  // Final — single leg
  const [gf, ga] = matchGoals(userStrength, nextOpp().s)
  totalKoGames++
  let wonFinal
  if (gf > ga) { koWins++; wonFinal = true }
  else if (ga > gf) { wonFinal = false }
  else { wonFinal = Math.random() < 0.5 } // coin flip, not a clean win

  if (!wonFinal) return { won: false, perfect15: false, position: pos, points: pts, leagueWins, leagueDraws, koWins, koDraws, wentPlayoff }

  // 15-0-0: top 8 direct + all 8 league wins + all 7 KO individual games won (no draws/losses)
  const totalGames = 8 + totalKoGames
  const allWins = leagueWins + koWins === totalGames && leagueDraws === 0 && koDraws === 0
  const perfect15 = !wentPlayoff && totalGames === 15 && allWins

  return { won: true, perfect15, position: pos, points: pts, leagueWins, leagueDraws, koWins, koDraws, wentPlayoff }
}

const RUNS = 200_000
const OVERALLS = [82, 85, 88, 90, 92, 95, 98]

console.log(`\nSimulation: ${RUNS.toLocaleString()} runs per overall\n`)
console.log(`${'OVR'.padEnd(5)} ${'Win%'.padStart(7)} ${'15-0-0%'.padStart(9)} ${'Direct%'.padStart(9)} ${'Avg Pos'.padStart(8)} ${'Avg Pts'.padStart(8)}`)
console.log('─'.repeat(50))

for (const ovr of OVERALLS) {
  let wins = 0, perfect = 0, direct = 0, totalPos = 0, totalPts = 0
  for (let i = 0; i < RUNS; i++) {
    const r = simulate(ovr)
    if (r.won) wins++
    if (r.perfect15) perfect++
    if (!r.wentPlayoff && r.position <= 8) direct++
    totalPos += r.position
    totalPts += r.points
  }
  const pct = n => (n / RUNS * 100).toFixed(2) + '%'
  const avgPos = (totalPos / RUNS).toFixed(1)
  const avgPts = (totalPts / RUNS).toFixed(1)
  console.log(`${String(ovr).padEnd(5)} ${pct(wins).padStart(7)} ${pct(perfect).padStart(9)} ${pct(direct).padStart(9)} ${avgPos.padStart(8)} ${avgPts.padStart(8)}`)
}

console.log('\nNote: 15-0-0 = direct top-8 qualification + all 15 games won in regulation (no draws or aggregate ties)')
console.log('Realistic elite team overall: ~90-93. Absolute ceiling (prime mode, perfect draft): ~95-97\n')
