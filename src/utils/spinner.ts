import { CL_CLUB_SEASONS } from '../data/clTable2526'
import { PLAYERS } from '../data/players'

// Filter to only club+season pairs that have at least 2 players in the database
const VALID_PAIRS = CL_CLUB_SEASONS.filter(({ club, season }) =>
  PLAYERS.filter(p => p.seasons.some(s => s.club === club && s.season === season)).length >= 2
)

type Eligible = {
  // Position codes still needed by open slots (union of their `accepts`).
  positions: string[]
  // Player ids already drafted — excluded when checking a pair is fillable.
  draftedIds: string[]
}

export function spinClubSeason(
  alreadyDrafted: { club: string; season: string }[],
  eligible?: Eligible
): {
  club: string
  season: string
} {
  // Restrict to pairs that have at least one un-drafted player who can fill an
  // open slot, so a spin can never strand the user with an unfillable result.
  let pool = VALID_PAIRS
  if (eligible) {
    const filtered = VALID_PAIRS.filter(({ club, season }) =>
      PLAYERS.some(p =>
        !eligible.draftedIds.includes(p.id) &&
        p.seasons.some(s => s.club === club && s.season === season) &&
        p.positions.some(pos => eligible.positions.includes(pos))
      )
    )
    if (filtered.length) pool = filtered
  }

  // Slightly down-weight pairs we've already used (but still allow repeats)
  const usedSet = new Set(alreadyDrafted.map(d => `${d.club}|${d.season}`))
  const weighted = pool.map(p => ({
    ...p,
    weight: usedSet.has(`${p.club}|${p.season}`) ? 0.3 : 1,
  }))
  const totalWeight = weighted.reduce((acc, w) => acc + w.weight, 0)
  let r = Math.random() * totalWeight
  for (const p of weighted) {
    r -= p.weight
    if (r <= 0) return { club: p.club, season: p.season }
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

export { VALID_PAIRS }
