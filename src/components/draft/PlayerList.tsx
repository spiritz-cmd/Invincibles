import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYERS } from '../../data/players'
import { useGameStore } from '../../store/gameStore'
import type { DraftedPlayer } from '../../store/gameStore'
import type { PositionSlot } from '../../data/formations'
import { slotStatus, canFillAnySlot } from '../../utils/positionRules'

type Props = {
  club: string
  season: string
  alreadyDraftedIds: string[]
  emptySlots: PositionSlot[]
  onPick: (drafted: DraftedPlayer) => void
  autoAssignSlot?: PositionSlot // position-first: skip picker, auto-assign
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-amber-500',
  CB: 'bg-blue-600', LB: 'bg-blue-600', RB: 'bg-blue-600', LWB: 'bg-blue-600', RWB: 'bg-blue-600',
  DM: 'bg-green-700', CM: 'bg-green-700', AM: 'bg-green-600', LM: 'bg-green-600', RM: 'bg-green-600',
  LW: 'bg-red-600', RW: 'bg-red-600', ST: 'bg-red-600', CF: 'bg-red-600',
}

function getPlayersByClubSeason(club: string, season: string) {
  return PLAYERS.filter(p => p.seasons.some(s => s.club === club && s.season === season))
}

export function PlayerList({ club, season, alreadyDraftedIds, emptySlots, onPick, autoAssignSlot }: Props) {
  const { showRatings, ratingsMode } = useGameStore()
  const isPrime = ratingsMode === 'prime'
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const players = getPlayersByClubSeason(club, season)
    .filter(p => !alreadyDraftedIds.includes(p.id))
    .filter(p => canFillAnySlot(p.positions, emptySlots))
    .map(p => {
      const seasonEntry = p.seasons.find(s => s.club === club && s.season === season)!
      const { rating, actualSeason } = isPrime
        ? { rating: p.primeRating, actualSeason: p.primeSeason }
        : { rating: seasonEntry.rating, actualSeason: season }
      return { player: p, rating, actualSeason }
    })
    .sort((a, b) => b.rating - a.rating)

  if (players.length === 0) {
    return (
      <p className="text-zinc-500 text-sm text-center py-4">
        No available players from {club} ({season}) fit your open positions.
      </p>
    )
  }

  const selectedEntry = selectedId ? players.find(p => p.player.id === selectedId) : null

  const handleSlotPick = (slot: PositionSlot, penalty: number) => {
    if (!selectedEntry) return
    const { player, rating, actualSeason } = selectedEntry
    const finalRating = penalty > 0 ? Math.round(rating * (1 - penalty)) : rating
    onPick({ player, club, season: actualSeason, rating: finalRating, slotId: slot.id })
    setSelectedId(null)
  }

  return (
    <div className="flex flex-col gap-1 mt-3 max-h-[60vh] overflow-y-auto pr-1">
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-2 rounded-xl border border-zinc-700 bg-zinc-900 p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">
                Place <span className="text-red-400">{selectedEntry.player.name}</span>
              </p>
              <button
                onClick={() => setSelectedId(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-2 py-0.5 rounded transition-colors"
              >
                Cancel
              </button>
            </div>

            {(() => {
              const available = emptySlots.filter(s => slotStatus(selectedEntry.player.positions, s) === 'available')
              const penalty = emptySlots.filter(s => slotStatus(selectedEntry.player.positions, s) === 'penalty')
              const unavailable = emptySlots.filter(s => slotStatus(selectedEntry.player.positions, s) === 'unavailable')

              return (
                <>
                  {available.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-green-500 font-bold mb-1.5">
                        Available ({available.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {available.map(slot => {
                          const bg = POSITION_COLORS[slot.accepts[0]] ?? 'bg-zinc-600'
                          return (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotPick(slot, 0)}
                              className={`px-3 py-1.5 rounded-lg ${bg} hover:opacity-80 text-white font-bold text-xs transition-opacity`}
                            >
                              {slot.label} ({slot.accepts[0]})
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {penalty.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1.5">
                        Penalised −4% ({penalty.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {penalty.map(slot => {
                          const bg = POSITION_COLORS[slot.accepts[0]] ?? 'bg-zinc-600'
                          return (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotPick(slot, 0.04)}
                              className={`px-3 py-1.5 rounded-lg ${bg} opacity-60 hover:opacity-80 text-white font-bold text-xs transition-opacity border border-amber-500`}
                            >
                              {slot.label} ({slot.accepts[0]}) −4%
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {unavailable.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">
                        Unavailable
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {unavailable.map(slot => (
                          <span
                            key={slot.id}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs"
                          >
                            {slot.accepts[0]} · N/A
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {players.map(({ player, rating, actualSeason }, i) => {
        const isSelected = selectedId === player.id
        return (
          <motion.button
            key={player.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.3) }}
            onClick={() => {
            if (autoAssignSlot) {
              const penalty = slotStatus(player.positions, autoAssignSlot) === 'penalty' ? 0.04 : 0
              const seasonEntry = players.find(p => p.player.id === player.id)
              if (!seasonEntry) return
              onPick({ player, club, season: seasonEntry.actualSeason, rating: penalty > 0 ? Math.round(seasonEntry.rating * (1 - penalty)) : seasonEntry.rating, slotId: autoAssignSlot.id })
              return
            }
            setSelectedId(isSelected ? null : player.id)
          }}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all text-left border ${
              isSelected
                ? 'bg-zinc-800 border-red-600'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <span className="flex items-center gap-0.5 flex-shrink-0">
              {player.positions.map(pos => (
                <span
                  key={pos}
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${POSITION_COLORS[pos] ?? 'bg-zinc-600'} text-white`}
                >
                  {pos}
                </span>
              ))}
            </span>
            <span className="flex-1 text-white text-sm font-medium">{player.name}</span>
            <span className="text-xs text-zinc-600">{actualSeason}</span>
            <span className="text-xs text-zinc-500">{player.nationality}</span>
            {showRatings && (
              <span className={`text-sm font-bold w-8 text-right ${rating >= 95 ? 'text-slate-200' : rating >= 90 ? 'text-yellow-400' : rating >= 85 ? 'text-green-400' : rating >= 80 ? 'text-amber-400' : rating >= 75 ? 'text-zinc-400' : 'text-red-500'}`}>
                {rating}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
