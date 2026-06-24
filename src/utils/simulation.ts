import { CL_TEAMS_2526 } from '../data/clTable2526'
import { PLAYERS } from '../data/players'
import type { DraftedPlayer, MatchResult, SimulationResult, TeamStanding } from '../store/gameStore'

const USER_TEAM = 'Your Team'

function poisson(lambda: number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Best-XI overall for a club's exact 2025-26 squad, using current-season ratings
// (never prime). Mirrors how the user's overall is built so the two are comparable.
const overallCache = new Map<string, number>()
export function clubOverall2526(club: string): number {
  const cached = overallCache.get(club)
  if (cached !== undefined) return cached

  const squad: { gk: boolean; rating: number }[] = []
  for (const p of PLAYERS) {
    const s = p.seasons.find((se) => se.club === club && se.season === '2025-26')
    if (s) squad.push({ gk: p.positions[0] === 'GK', rating: s.rating })
  }

  let val = 75
  if (squad.length) {
    const gks = squad.filter((x) => x.gk).sort((a, b) => b.rating - a.rating)
    const outfield = squad.filter((x) => !x.gk).sort((a, b) => b.rating - a.rating)
    const xi = [...gks.slice(0, 1), ...outfield.slice(0, 11 - Math.min(1, gks.length))]
    val = Math.round(xi.reduce((a, b) => a + b.rating, 0) / xi.length)
  }
  overallCache.set(club, val)
  return val
}

// Goals for two teams from their overalls. The overall gap shifts the expected
// goals (an edge, not a guarantee); Poisson noise keeps every result uncertain,
// so a stronger side can still drop points.
function matchGoals(a: number, b: number): [number, number] {
  const diff = (a - b) / 22
  const lambdaA = Math.max(0.15, 0.95 + diff * 2)
  const lambdaB = Math.max(0.15, 0.95 - diff * 2)
  return [poisson(lambdaA), poisson(lambdaB)]
}

function userScorers(goals: number, players: DraftedPlayer[]): string[] {
  const attackers = players
    .filter((dp) => !['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(dp.player.positions[0]))
    .map((dp) => dp.player.name)
  const out: string[] = []
  for (let i = 0; i < goals; i++) {
    const s = attackers[Math.floor(Math.random() * attackers.length)]
    if (s) out.push(s)
  }
  return out
}

function userMatch(
  userStrength: number,
  opp: TeamStanding,
  players: DraftedPlayer[],
  stage: string,
  leg?: 1 | 2
): MatchResult {
  const [gf, ga] = matchGoals(userStrength, opp.strength)
  return {
    opponent: opp.name,
    opponentStrength: opp.strength,
    goalsFor: gf,
    goalsAgainst: ga,
    scorers: userScorers(gf, players),
    stage,
    leg,
  }
}

// First `rounds` rounds of a circle-method round-robin over `n` teams. Each team
// gets exactly `rounds` distinct opponents — the 8-game league-phase shape.
function leagueSchedule(n: number, rounds: number): [number, number][] {
  const ids = Array.from({ length: n }, (_, i) => i)
  const fixed = ids[0]
  let rot = ids.slice(1)
  const fixtures: [number, number][] = []
  for (let r = 0; r < rounds; r++) {
    const round = [fixed, ...rot]
    for (let k = 0; k < n / 2; k++) fixtures.push([round[k], round[n - 1 - k]])
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)]
  }
  return fixtures
}

export type QuickOutcome = { points: number; position: number; won: boolean }

// Fast, numbers-only run of the same model (league phase + knockout) used for
// Monte-Carlo pre-season odds. No MatchResults/scorers — just the outcome.
export function quickOutcome(userStrength: number): QuickOutcome {
  const field = shuffle([
    { strength: userStrength, isUser: true },
    ...CL_TEAMS_2526.map((t) => ({ strength: clubOverall2526(t.name), isUser: false })),
  ])
  const n = field.length
  const st = field.map((t) => ({ strength: t.strength, gf: 0, ga: 0, pts: 0, isUser: t.isUser }))

  for (const [i, j] of leagueSchedule(n, 8)) {
    const [gi, gj] = matchGoals(field[i].strength, field[j].strength)
    st[i].gf += gi; st[i].ga += gj; st[j].gf += gj; st[j].ga += gi
    if (gi > gj) st[i].pts += 3
    else if (gj > gi) st[j].pts += 3
    else { st[i].pts++; st[j].pts++ }
  }
  st.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  const position = st.findIndex((s) => s.isUser) + 1
  const points = st[position - 1].pts

  let won = false
  if (position <= 24) {
    const others = st.filter((s) => !s.isUser)
    const playoffPool = shuffle(others.slice(8, 24))
    const koPool = shuffle(others.slice(0, 16))
    let ki = 0
    const nextOpp = () => koPool[ki++ % koPool.length]
    const tieLost = (oppStrength: number): boolean => {
      const [a1, b1] = matchGoals(userStrength, oppStrength)
      const [a2, b2] = matchGoals(userStrength, oppStrength)
      const aggFor = a1 + a2
      const aggAgainst = b1 + b2
      return aggFor === aggAgainst ? Math.random() < 0.5 : aggFor < aggAgainst
    }
    let out = false
    if (position > 8) {
      const opp = playoffPool[0] ?? nextOpp()
      if (tieLost(opp.strength)) out = true
    }
    if (!out) {
      for (let r = 0; r < 3 && !out; r++) if (tieLost(nextOpp().strength)) out = true
    }
    if (!out) {
      const [gf, ga] = matchGoals(userStrength, nextOpp().strength)
      won = gf > ga || (gf === ga && Math.random() < 0.5)
    }
  }
  return { points, position, won }
}

export function simulateSeason(
  userStrength: number,
  draftedPlayers: DraftedPlayer[]
): SimulationResult {
  // 36-team field: the user's drafted XI plus the 35 real CL clubs, each with a
  // real overall derived from their 2025-26 squad.
  const field = shuffle([
    { name: USER_TEAM, strength: userStrength, isUser: true },
    ...CL_TEAMS_2526.map((t) => ({ name: t.name, strength: clubOverall2526(t.name), isUser: false })),
  ])
  const n = field.length

  const standings: TeamStanding[] = field.map((t) => ({
    name: t.name,
    strength: t.strength,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
    isUser: t.isUser,
  }))

  // Play the whole league phase so every team has a real points total.
  const leaguePhaseResults: MatchResult[] = []
  for (const [i, j] of leagueSchedule(n, 8)) {
    const [gi, gj] = matchGoals(field[i].strength, field[j].strength)
    const si = standings[i]
    const sj = standings[j]
    si.played++; sj.played++
    si.gf += gi; si.ga += gj
    sj.gf += gj; sj.ga += gi
    if (gi > gj) { si.won++; sj.lost++; si.points += 3 }
    else if (gi < gj) { sj.won++; si.lost++; sj.points += 3 }
    else { si.drawn++; sj.drawn++; si.points++; sj.points++ }

    if (field[i].isUser || field[j].isUser) {
      const userIsI = field[i].isUser
      const gf = userIsI ? gi : gj
      const ga = userIsI ? gj : gi
      const oppTeam = userIsI ? field[j] : field[i]
      leaguePhaseResults.push({
        opponent: oppTeam.name,
        opponentStrength: oppTeam.strength,
        goalsFor: gf,
        goalsAgainst: ga,
        scorers: userScorers(gf, draftedPlayers),
        stage: 'League Phase',
      })
    }
  }

  // Final league table: points, then goal difference, then goals for.
  standings.sort(
    (a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
  )
  const leagueTable = standings
  const userPos = standings.findIndex((s) => s.isUser) + 1
  const userRow = standings[userPos - 1]

  const advancedAs: SimulationResult['advancedAs'] =
    userPos <= 8 ? 'direct' : userPos <= 24 ? 'playoff' : 'eliminated'

  const base = {
    leaguePhaseResults,
    leaguePhasePosition: userPos,
    leaguePhasePoints: userRow.points,
    leaguePhaseGF: userRow.gf,
    leaguePhaseGA: userRow.ga,
    advancedAs,
    leagueTable,
  }

  const knockoutResults: MatchResult[] = []
  if (advancedAs === 'eliminated') {
    return { ...base, knockoutResults, finalPosition: `Eliminated in League Phase (${userPos}th)`, won: false }
  }

  // Knockout opponents are drawn from the real standings (never the user).
  const others = standings.filter((s) => !s.isUser)
  const playoffPool = shuffle(others.slice(8, 24))
  const koPool = shuffle(others.slice(0, 16))
  let koIdx = 0
  const nextKoOpp = (): TeamStanding => koPool[koIdx++ % koPool.length]

  // Two-legged tie on aggregate; a level aggregate is a coin flip (penalties).
  const playTie = (opp: TeamStanding, stage: string): boolean => {
    const l1 = userMatch(userStrength, opp, draftedPlayers, stage, 1)
    const l2 = userMatch(userStrength, opp, draftedPlayers, stage, 2)
    knockoutResults.push(l1, l2)
    const aggFor = l1.goalsFor + l2.goalsFor
    const aggAgainst = l1.goalsAgainst + l2.goalsAgainst
    if (aggFor === aggAgainst) return Math.random() < 0.5
    return aggFor < aggAgainst
  }

  if (advancedAs === 'playoff') {
    const opp = playoffPool[0] ?? nextKoOpp()
    if (playTie(opp, 'Playoff')) {
      return { ...base, knockoutResults, finalPosition: 'Eliminated in Playoff Round', won: false }
    }
  }

  for (const roundName of ['Round of 16', 'Quarter-Final', 'Semi-Final']) {
    if (playTie(nextKoOpp(), roundName)) {
      return { ...base, knockoutResults, finalPosition: `Eliminated in ${roundName}`, won: false }
    }
  }

  // Final — single leg, coin flip if level.
  const finalOpp = nextKoOpp()
  const final = userMatch(userStrength, finalOpp, draftedPlayers, 'Final')
  knockoutResults.push(final)
  let won = final.goalsFor > final.goalsAgainst
  if (final.goalsFor === final.goalsAgainst) won = Math.random() < 0.5

  return {
    ...base,
    knockoutResults,
    finalPosition: won ? 'Champions League Winner!' : `Runner-Up (Final vs ${finalOpp.name})`,
    won,
  }
}
