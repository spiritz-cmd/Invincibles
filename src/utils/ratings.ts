import type { DraftedPlayer } from '../store/gameStore'

export function computeOverall(draftedPlayers: DraftedPlayer[]): {
  overall: number
  attack: number
  midfield: number
  defence: number
  gk: number
} {
  const byGroup = { ATT: [] as number[], MID: [] as number[], DEF: [] as number[], GK: [] as number[] }

  for (const dp of draftedPlayers) {
    const pos = dp.player.positions[0]
    const r = dp.rating
    if (pos === 'GK') byGroup.GK.push(r)
    else if (['ST', 'CF', 'LW', 'RW', 'AM'].includes(pos)) byGroup.ATT.push(r)
    else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) byGroup.DEF.push(r)
    else byGroup.MID.push(r)
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

  const attack = avg(byGroup.ATT)
  const midfield = avg(byGroup.MID)
  const defence = avg(byGroup.DEF)
  const gk = avg(byGroup.GK)

  const all = [...byGroup.ATT, ...byGroup.MID, ...byGroup.DEF, ...byGroup.GK]
  const overall = avg(all)

  return { overall, attack, midfield, defence, gk }
}

// Tailwind text colour class by rating tier
export function ratingColor(r: number): string {
  if (r >= 95) return 'text-slate-200'   // Platinum
  if (r >= 90) return 'text-yellow-400'  // Gold
  if (r >= 85) return 'text-green-400'   // Green
  if (r >= 80) return 'text-amber-400'   // Amber
  if (r >= 75) return 'text-zinc-400'    // Grey
  return 'text-red-500'                  // Red
}

// Hex colour for canvas rendering
export function ratingColorHex(r: number): string {
  if (r >= 95) return '#e2e8f0'  // Platinum
  if (r >= 90) return '#facc15'  // Gold
  if (r >= 85) return '#4ade80'  // Green
  if (r >= 80) return '#fbbf24'  // Amber
  if (r >= 75) return '#a1a1aa'  // Grey
  return '#ef4444'               // Red
}

export function positionFit(playerPositions: string[], slotAccepts: string[]): 'natural' | 'okay' | 'unnatural' {
  if (playerPositions.some(p => slotAccepts[0] === p)) return 'natural'
  if (playerPositions.some(p => slotAccepts.includes(p))) return 'okay'
  return 'unnatural'
}
