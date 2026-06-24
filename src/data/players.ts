import { PLAYER_ROWS } from './playerSeasons'

export type PlayerSeason = {
  season: string
  club: string
  rating: number
  clApps: number
}

export type Player = {
  id: string
  name: string
  nationality: string
  positions: string[]
  seasons: PlayerSeason[]
  primeRating: number
  primeClub: string
  primeSeason: string
}

// Build Player[] from flat rows — group by id, compute prime from max rating row.
function buildPlayers(): Player[] {
  const map = new Map<string, Player>()
  for (const r of PLAYER_ROWS) {
    if (!map.has(r.id)) {
      map.set(r.id, {
        id: r.id,
        name: r.name,
        nationality: r.nationality,
        positions: r.positions,
        seasons: [],
        primeRating: 0,
        primeClub: '',
        primeSeason: '',
      })
    }
    const p = map.get(r.id)!
    p.seasons.push({ season: r.season, club: r.club, rating: r.rating, clApps: r.clApps })
    if (r.rating > p.primeRating) {
      p.primeRating = r.rating
      p.primeClub = r.club
      p.primeSeason = r.season
    }
  }
  return [...map.values()]
}

export const PLAYERS: Player[] = buildPlayers()

export function getPlayersByClubSeason(club: string, season: string): Player[] {
  return PLAYERS.filter(p => p.seasons.some(s => s.club === club && s.season === season))
}

export function getPlayerRating(player: Player, club: string, season: string, primeMode: boolean): number {
  if (primeMode) return player.primeRating
  const s = player.seasons.find(s => s.club === club && s.season === season)
  return s?.rating ?? player.primeRating
}
