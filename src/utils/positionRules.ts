import type { PositionSlot } from '../data/formations'

export type SlotStatus = 'available' | 'penalty' | 'unavailable'

export function slotStatus(positions: string[], slot: PositionSlot): SlotStatus {
  const primary = slot.accepts[0]
  const has = (p: string) => positions.includes(p)

  if (slot.accepts.some(a => has(a))) return 'available'

  // LM/RM (without LW/RW) ↔ LW/RW, 4% penalty — strictly same side only
  if (has('LM') && !has('LW') && primary === 'LW') return 'penalty'
  if (has('RM') && !has('RW') && primary === 'RW') return 'penalty'
  if (has('LW') && !has('LM') && primary === 'LM') return 'penalty'
  if (has('RW') && !has('RM') && primary === 'RM') return 'penalty'

  // LB/RB (without LWB/RWB) ↔ LWB/RWB, 4% penalty — strictly same side only
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

// Returns the slot's natural accepts plus penalty-eligible positions,
// so the spinner can find clubs that have players for a slot even via penalty.
export function expandedAccepts(accepts: string[]): string[] {
  const set = new Set(accepts)
  if (set.has('LW'))  set.add('LM')
  if (set.has('LM'))  set.add('LW')
  if (set.has('RW'))  set.add('RM')
  if (set.has('RM'))  set.add('RW')
  if (set.has('LB'))  set.add('LWB')
  if (set.has('LWB')) set.add('LB')
  if (set.has('RB'))  set.add('RWB')
  if (set.has('RWB')) set.add('RB')
  return [...set]
}
