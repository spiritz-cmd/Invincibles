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

export function positionFit(playerPositions: string[], slotAccepts: string[]): 'natural' | 'okay' | 'unnatural' {
  if (playerPositions.some(p => slotAccepts[0] === p)) return 'natural'
  if (playerPositions.some(p => slotAccepts.includes(p))) return 'okay'
  return 'unnatural'
}
