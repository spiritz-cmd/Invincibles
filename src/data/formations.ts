export type PositionSlot = {
  id: string
  label: string
  x: number // 0-100 percentage across pitch width
  y: number // 0-100 percentage down pitch (0=opponent goal, 100=own goal)
  group: 'GK' | 'DEF' | 'MID' | 'ATT'
  accepts: string[] // position codes this slot accepts naturally
}

export type Formation = {
  name: string
  slots: PositionSlot[]
  description: string
}

function gk(): PositionSlot {
  return { id: 'GK', label: 'GK', x: 50, y: 92, group: 'GK', accepts: ['GK'] }
}

export const FORMATIONS: Record<string, Formation> = {
  '4-3-3': {
    name: '4-3-3',
    description: 'Attacking with width. Three forwards create constant threat.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'CM1', label: 'CM', x: 25, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM', 'LM'] },
      { id: 'CM2', label: 'CM', x: 50, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM3', label: 'CM', x: 75, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM', 'RM'] },
      { id: 'LW', label: 'LW', x: 15, y: 25, group: 'ATT', accepts: ['LW', 'LM', 'ST', 'AM'] },
      { id: 'ST', label: 'ST', x: 50, y: 18, group: 'ATT', accepts: ['ST', 'CF', 'AM'] },
      { id: 'RW', label: 'RW', x: 85, y: 25, group: 'ATT', accepts: ['RW', 'RM', 'ST', 'AM'] },
    ],
  },
  '4-4-2': {
    name: '4-4-2',
    description: 'Classic English setup. Balance across the pitch.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'LM', label: 'LM', x: 15, y: 52, group: 'MID', accepts: ['LM', 'LW', 'CM', 'LB'] },
      { id: 'CM1', label: 'CM', x: 38, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 62, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RM', label: 'RM', x: 85, y: 52, group: 'MID', accepts: ['RM', 'RW', 'CM', 'RB'] },
      { id: 'ST1', label: 'ST', x: 35, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'AM', 'LW'] },
      { id: 'ST2', label: 'ST', x: 65, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'AM', 'RW'] },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    description: 'Double pivot shields defence. Fluid attack.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'DM1', label: 'DM', x: 35, y: 60, group: 'MID', accepts: ['DM', 'CM'] },
      { id: 'DM2', label: 'DM', x: 65, y: 60, group: 'MID', accepts: ['DM', 'CM'] },
      { id: 'LW', label: 'LW', x: 18, y: 38, group: 'MID', accepts: ['LW', 'LM', 'AM', 'ST'] },
      { id: 'AM', label: 'AM', x: 50, y: 35, group: 'MID', accepts: ['AM', 'CM', 'ST'] },
      { id: 'RW', label: 'RW', x: 82, y: 38, group: 'MID', accepts: ['RW', 'RM', 'AM', 'ST'] },
      { id: 'ST', label: 'ST', x: 50, y: 18, group: 'ATT', accepts: ['ST', 'CF', 'AM'] },
    ],
  },
  '4-5-1': {
    name: '4-5-1',
    description: 'Compact midfield five. Built to control possession.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'LM', label: 'LM', x: 12, y: 50, group: 'MID', accepts: ['LM', 'LW', 'CM'] },
      { id: 'CM1', label: 'CM', x: 30, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 50, y: 50, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM3', label: 'CM', x: 70, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RM', label: 'RM', x: 88, y: 50, group: 'MID', accepts: ['RM', 'RW', 'CM'] },
      { id: 'ST', label: 'ST', x: 50, y: 18, group: 'ATT', accepts: ['ST', 'CF', 'AM'] },
    ],
  },
  '3-4-3': {
    name: '3-4-3',
    description: 'Three at the back. Width from wing-backs.',
    slots: [
      gk(),
      { id: 'CB1', label: 'CB', x: 25, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 50, y: 80, group: 'DEF', accepts: ['CB'] },
      { id: 'CB3', label: 'CB', x: 75, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'LWB', label: 'LWB', x: 12, y: 55, group: 'MID', accepts: ['LB', 'LWB', 'LM', 'CM'] },
      { id: 'CM1', label: 'CM', x: 35, y: 56, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 65, y: 56, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RWB', label: 'RWB', x: 88, y: 55, group: 'MID', accepts: ['RB', 'RWB', 'RM', 'CM'] },
      { id: 'LW', label: 'LW', x: 18, y: 25, group: 'ATT', accepts: ['LW', 'LM', 'ST', 'AM'] },
      { id: 'ST', label: 'ST', x: 50, y: 18, group: 'ATT', accepts: ['ST', 'CF', 'AM'] },
      { id: 'RW', label: 'RW', x: 82, y: 25, group: 'ATT', accepts: ['RW', 'RM', 'ST', 'AM'] },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    description: 'Midfield dominance with two strikers up front.',
    slots: [
      gk(),
      { id: 'CB1', label: 'CB', x: 25, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 50, y: 80, group: 'DEF', accepts: ['CB'] },
      { id: 'CB3', label: 'CB', x: 75, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'LWB', label: 'LWB', x: 12, y: 55, group: 'MID', accepts: ['LB', 'LWB', 'LM', 'CM'] },
      { id: 'CM1', label: 'CM', x: 30, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 50, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM3', label: 'CM', x: 70, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RWB', label: 'RWB', x: 88, y: 55, group: 'MID', accepts: ['RB', 'RWB', 'RM', 'CM'] },
      { id: 'ST1', label: 'ST', x: 35, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'AM', 'LW'] },
      { id: 'ST2', label: 'ST', x: 65, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'AM', 'RW'] },
    ],
  },
  '5-4-1': {
    name: '5-4-1',
    description: 'Defensive solidity. Five at the back, four in midfield.',
    slots: [
      gk(),
      { id: 'LWB', label: 'LWB', x: 10, y: 70, group: 'DEF', accepts: ['LB', 'LWB', 'LM'] },
      { id: 'CB1', label: 'CB', x: 28, y: 78, group: 'DEF', accepts: ['CB', 'LB'] },
      { id: 'CB2', label: 'CB', x: 50, y: 80, group: 'DEF', accepts: ['CB'] },
      { id: 'CB3', label: 'CB', x: 72, y: 78, group: 'DEF', accepts: ['CB', 'RB'] },
      { id: 'RWB', label: 'RWB', x: 90, y: 70, group: 'DEF', accepts: ['RB', 'RWB', 'RM'] },
      { id: 'LM', label: 'LM', x: 18, y: 50, group: 'MID', accepts: ['LM', 'LW', 'CM'] },
      { id: 'CM1', label: 'CM', x: 38, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 62, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RM', label: 'RM', x: 82, y: 50, group: 'MID', accepts: ['RM', 'RW', 'CM'] },
      { id: 'ST', label: 'ST', x: 50, y: 18, group: 'ATT', accepts: ['ST', 'CF', 'AM'] },
    ],
  },
  '4-1-2-1-2': {
    name: '4-1-2-1-2',
    description: 'The diamond. Compact and direct through the centre.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'DM', label: 'DM', x: 50, y: 63, group: 'MID', accepts: ['DM', 'CM'] },
      { id: 'CM1', label: 'CM', x: 28, y: 50, group: 'MID', accepts: ['CM', 'AM', 'DM'] },
      { id: 'CM2', label: 'CM', x: 72, y: 50, group: 'MID', accepts: ['CM', 'AM', 'DM'] },
      { id: 'AM', label: 'AM', x: 50, y: 37, group: 'MID', accepts: ['AM', 'CM', 'ST'] },
      { id: 'ST1', label: 'ST', x: 35, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'LW'] },
      { id: 'ST2', label: 'ST', x: 65, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'RW'] },
    ],
  },
  '4-4-1-1': {
    name: '4-4-1-1',
    description: 'A shadow striker behind the main forward.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'LM', label: 'LM', x: 15, y: 52, group: 'MID', accepts: ['LM', 'LW', 'CM'] },
      { id: 'CM1', label: 'CM', x: 38, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 62, y: 55, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RM', label: 'RM', x: 85, y: 52, group: 'MID', accepts: ['RM', 'RW', 'CM'] },
      { id: 'SS', label: 'SS', x: 50, y: 32, group: 'ATT', accepts: ['AM', 'ST', 'CM', 'LW', 'RW'] },
      { id: 'ST', label: 'ST', x: 50, y: 18, group: 'ATT', accepts: ['ST', 'CF'] },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    description: 'Five defenders with three midfielders. Narrow and direct.',
    slots: [
      gk(),
      { id: 'LWB', label: 'LWB', x: 10, y: 70, group: 'DEF', accepts: ['LB', 'LWB', 'LM'] },
      { id: 'CB1', label: 'CB', x: 28, y: 78, group: 'DEF', accepts: ['CB', 'LB'] },
      { id: 'CB2', label: 'CB', x: 50, y: 80, group: 'DEF', accepts: ['CB'] },
      { id: 'CB3', label: 'CB', x: 72, y: 78, group: 'DEF', accepts: ['CB', 'RB'] },
      { id: 'RWB', label: 'RWB', x: 90, y: 70, group: 'DEF', accepts: ['RB', 'RWB', 'RM'] },
      { id: 'CM1', label: 'CM', x: 28, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 50, y: 50, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM3', label: 'CM', x: 72, y: 52, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'ST1', label: 'ST', x: 35, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'LW'] },
      { id: 'ST2', label: 'ST', x: 65, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'RW'] },
    ],
  },
  '3-4-1-2': {
    name: '3-4-1-2',
    description: 'Three centre-backs with an attacking midfielder as the link.',
    slots: [
      gk(),
      { id: 'CB1', label: 'CB', x: 25, y: 78, group: 'DEF', accepts: ['CB', 'LB'] },
      { id: 'CB2', label: 'CB', x: 50, y: 80, group: 'DEF', accepts: ['CB'] },
      { id: 'CB3', label: 'CB', x: 75, y: 78, group: 'DEF', accepts: ['CB', 'RB'] },
      { id: 'LWB', label: 'LWB', x: 12, y: 56, group: 'MID', accepts: ['LB', 'LWB', 'LM'] },
      { id: 'CM1', label: 'CM', x: 35, y: 58, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'CM2', label: 'CM', x: 65, y: 58, group: 'MID', accepts: ['CM', 'DM', 'AM'] },
      { id: 'RWB', label: 'RWB', x: 88, y: 56, group: 'MID', accepts: ['RB', 'RWB', 'RM'] },
      { id: 'AM', label: 'AM', x: 50, y: 37, group: 'MID', accepts: ['AM', 'CM', 'ST', 'LW', 'RW'] },
      { id: 'ST1', label: 'ST', x: 35, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'LW'] },
      { id: 'ST2', label: 'ST', x: 65, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'RW'] },
    ],
  },
  '4-2-2-2': {
    name: '4-2-2-2',
    description: 'Double pivot with two attacking mids and two strikers.',
    slots: [
      gk(),
      { id: 'LB', label: 'LB', x: 15, y: 75, group: 'DEF', accepts: ['LB', 'LWB', 'CB'] },
      { id: 'CB1', label: 'CB', x: 35, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'CB2', label: 'CB', x: 65, y: 78, group: 'DEF', accepts: ['CB', 'LB', 'RB'] },
      { id: 'RB', label: 'RB', x: 85, y: 75, group: 'DEF', accepts: ['RB', 'RWB', 'CB'] },
      { id: 'DM1', label: 'DM', x: 35, y: 60, group: 'MID', accepts: ['DM', 'CM'] },
      { id: 'DM2', label: 'DM', x: 65, y: 60, group: 'MID', accepts: ['DM', 'CM'] },
      { id: 'AM1', label: 'AM', x: 25, y: 40, group: 'MID', accepts: ['AM', 'LW', 'CM'] },
      { id: 'AM2', label: 'AM', x: 75, y: 40, group: 'MID', accepts: ['AM', 'RW', 'CM'] },
      { id: 'ST1', label: 'ST', x: 35, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'LW'] },
      { id: 'ST2', label: 'ST', x: 65, y: 20, group: 'ATT', accepts: ['ST', 'CF', 'RW'] },
    ],
  },
}

export const FORMATION_LIST = Object.keys(FORMATIONS)
