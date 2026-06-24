import { quickOutcome } from './simulation'

export type OddsResult = {
  projectedFinish: string
  expectedPoints: number
  winLeague: number
  top8: number
  top24: number
  eliminated: number
}

// Pre-season odds are now a Monte-Carlo of the *actual* simulation: we run the
// full 36-team league phase (+ knockout) many times against the real club
// overalls and aggregate where the user's XI lands.
export function computeOdds(overall: number): OddsResult {
  const N = 1200
  let pointsSum = 0
  let positionSum = 0
  let top8 = 0
  let top24 = 0
  let wins = 0

  for (let i = 0; i < N; i++) {
    const o = quickOutcome(overall)
    pointsSum += o.points
    positionSum += o.position
    if (o.position <= 8) top8++
    if (o.position <= 24) top24++
    if (o.won) wins++
  }

  const pct = (count: number) => Math.round((count / N) * 100)
  const expectedPoints = Math.round(pointsSum / N)
  const avgPosition = positionSum / N
  const top8Pct = pct(top8)
  const top24Pct = pct(top24)
  const winPct = pct(wins)

  let projectedFinish = 'Elimination (LP)'
  if (avgPosition <= 24) projectedFinish = 'Playoffs (9-24)'
  if (avgPosition <= 8) projectedFinish = 'Top 8 (Auto R16)'
  if (winPct >= 20) projectedFinish = 'Champions'

  return {
    projectedFinish,
    expectedPoints,
    winLeague: winPct,
    top8: top8Pct,
    top24: top24Pct,
    eliminated: 100 - top24Pct,
  }
}
