import { getFormation } from '../../store/gameStore'
import type { DraftedPlayer } from '../../store/gameStore'
import { positionFit } from '../../utils/ratings'

type Props = {
  formation: string
  draftedPlayers: DraftedPlayer[]
  showRatings: boolean
  onAssign: (playerId: string, slotId: string) => void
  compact?: boolean
  // move mode
  moveActive?: boolean
  movingPlayerId?: string | null
  validTargetSlotIds?: Set<string>
  onSelectForMove?: (playerId: string | null) => void
  // position-first draft
  selectedSlotId?: string | null
  onSelectSlot?: (slotId: string) => void
}

export function FormationPitch({
  formation, draftedPlayers, showRatings, onAssign, compact,
  moveActive, movingPlayerId, validTargetSlotIds, onSelectForMove,
  selectedSlotId, onSelectSlot,
}: Props) {
  const f = getFormation(formation)
  const slotMap = new Map(draftedPlayers.filter(d => d.slotId).map(d => [d.slotId!, d]))
  const isMovingMode = !!movingPlayerId
  const pitchH = compact ? 280 : 400

  const handleSlotClick = (slotId: string, dp: DraftedPlayer | undefined) => {
    // Move mode takes priority
    if (moveActive) {
      if (!isMovingMode) {
        if (dp) onSelectForMove?.(dp.player.id)
        return
      }
      if (dp?.player.id === movingPlayerId) { onSelectForMove?.(null); return }
      if (!validTargetSlotIds?.has(slotId)) return
      onAssign(movingPlayerId!, slotId)
      onSelectForMove?.(null)
      return
    }
    // Position-first: only empty slots are selectable
    if (onSelectSlot && !dp) {
      onSelectSlot(slotId)
    }
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5a1e 50%, #1a4a1a 100%)',
        height: pitchH,
      }}
    >
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <rect x="20" y="1" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <rect x="20" y="81" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      </svg>

      {f.slots.map(slot => {
        const dp = slotMap.get(slot.id)
        const isSelected = dp?.player.id === movingPlayerId
        const isValidTarget = isMovingMode && validTargetSlotIds?.has(slot.id) && !isSelected
        const isPositionSelected = !dp && slot.id === selectedSlotId

        return (
          <div
            key={slot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            {dp ? (
              <div
                className={`flex flex-col items-center gap-0.5 select-none ${moveActive ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleSlotClick(slot.id, dp)}
              >
                {(() => {
                  const fit = positionFit(dp.player.positions, slot.accepts)
                  const ringColor = isSelected
                    ? '#f59e0b'
                    : isValidTarget
                    ? '#4ade80'
                    : fit === 'natural' ? '#22c55e'
                    : fit === 'okay' ? '#eab308'
                    : '#ef4444'
                  return (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(120,85,0,0.35)' : 'rgba(0,0,0,0.28)',
                        boxShadow: isSelected
                          ? `0 0 0 2px ${ringColor}, 0 0 10px 2px rgba(251,191,36,0.35)`
                          : isValidTarget
                          ? `0 0 0 2px ${ringColor}, 0 0 8px 2px rgba(74,222,128,0.4)`
                          : `0 0 0 2px ${ringColor}`,
                        opacity: isMovingMode && !isSelected && !isValidTarget ? 0.35 : 1,
                      }}
                    >
                      <span className="text-white text-[9px] font-black leading-none text-center">
                        {dp.player.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )
                })()}
                <span className="text-[9px] text-white font-medium bg-black/60 px-1 rounded whitespace-nowrap max-w-[60px] truncate">
                  {dp.player.name.split(' ').slice(-1)[0]}
                </span>
                {showRatings && (
                  <span className={`text-[9px] font-bold ${dp.rating >= 95 ? 'text-slate-200' : dp.rating >= 90 ? 'text-yellow-400' : dp.rating >= 85 ? 'text-green-400' : dp.rating >= 80 ? 'text-amber-400' : dp.rating >= 75 ? 'text-zinc-400' : 'text-red-500'}`}>
                    {dp.rating}
                  </span>
                )}
              </div>
            ) : (
              <div
                className={`flex flex-col items-center gap-0.5 select-none ${isValidTarget || isPositionSelected || !!onSelectSlot ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => handleSlotClick(slot.id, undefined)}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    border: isValidTarget
                      ? '2px solid #4ade80'
                      : isPositionSelected
                      ? '2px solid #60a5fa'
                      : '2px dashed rgba(255,255,255,0.2)',
                    background: isValidTarget
                      ? 'rgba(74,222,128,0.12)'
                      : isPositionSelected
                      ? 'rgba(96,165,250,0.15)'
                      : 'rgba(0,0,0,0.25)',
                    boxShadow: isValidTarget
                      ? '0 0 10px 2px rgba(74,222,128,0.45)'
                      : isPositionSelected
                      ? '0 0 10px 3px rgba(96,165,250,0.5)'
                      : undefined,
                  }}
                >
                  <span className={`text-[9px] font-bold ${isValidTarget ? 'text-green-400' : isPositionSelected ? 'text-blue-400' : 'text-white/30'}`}>
                    {slot.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
