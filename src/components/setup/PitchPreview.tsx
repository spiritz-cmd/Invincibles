import { FORMATIONS } from '../../data/formations'

export function PitchPreview({ formation }: { formation: string }) {
  const f = FORMATIONS[formation]
  if (!f) return null

  return (
    <svg viewBox="0 0 100 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Pitch */}
      <rect x="0" y="0" width="100" height="140" fill="#1a3a1a" rx="2" />
      {/* Center circle */}
      <circle cx="50" cy="70" r="12" fill="none" stroke="#2d6a2d" strokeWidth="0.8" />
      {/* Halfway line */}
      <line x1="0" y1="70" x2="100" y2="70" stroke="#2d6a2d" strokeWidth="0.8" />
      {/* Penalty boxes */}
      <rect x="20" y="0" width="60" height="22" fill="none" stroke="#2d6a2d" strokeWidth="0.8" />
      <rect x="20" y="118" width="60" height="22" fill="none" stroke="#2d6a2d" strokeWidth="0.8" />
      {/* Player dots */}
      {f.slots.map(slot => (
        <circle
          key={slot.id}
          cx={slot.x}
          cy={slot.y * 1.4}
          r="4"
          fill={slot.group === 'GK' ? '#f59e0b' : slot.group === 'DEF' ? '#3b82f6' : slot.group === 'MID' ? '#10b981' : '#ef4444'}
        />
      ))}
    </svg>
  )
}
