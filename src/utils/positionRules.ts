import type { PositionSlot } from '../data/formations'

export type SlotStatus = 'available' | 'penalty' | 'unavailable'

export function slotStatus(positions: string[], slot: PositionSlot): SlotStatus {
  const primary = slot.accepts[0]
  const has = (p: string) => positions.includes(p)

  if (slot.accepts.some(a => has(a))) return 'available'

  // CF/ST-only → ST and CF interchangeable, no penalty
  const isStCfOnly = positions.length > 0 && positions.every(p => p === 'ST' || p === 'CF')
  if (isStCfOnly && (primary === 'ST' || primary === 'CF')) return 'available'

  // AM or DM → CM slot, no penalty
  if ((has('AM') || has('DM')) && primary === 'CM') return 'available'

  // LM/RM (without LW/RW) ↔ LW/RW, 4% penalty
  if (has('LM') && !has('LW') && primary === 'LW') return 'penalty'
  if (has('RM') && !has('RW') && primary === 'RW') return 'penalty'
  if (has('LW') && !has('LM') && primary === 'LM') return 'penalty'
  if (has('RW') && !has('RM') && primary === 'RM') return 'penalty'

  // LB/RB (without LWB/RWB) ↔ LWB/RWB, 4% penalty
  if (has('LB') && !has('LWB') && primary === 'LWB') return 'penalty'
  if (has('RB') && !has('RWB') && primary === 'RWB') return 'penalty'
  if (has('LWB') && !has('LB') && primary === 'LB') return 'penalty'
  if (has('RWB') && !has('RB') && primary === 'RB') return 'penalty'

  return 'unavailable'
}

export function canFillAnySlot(positions: string[], slots: PositionSlot[]): boolean {
  if (slots.length === 0) return true
  return slots.some(s => slotStatus(positions, s) !== 'unavailable')
}
