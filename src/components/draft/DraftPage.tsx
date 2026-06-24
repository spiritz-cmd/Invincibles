import { useState } from 'react'
import { useGameStore, getFormation } from '../../store/gameStore'
import type { DraftedPlayer } from '../../store/gameStore'
import type { PositionSlot } from '../../data/formations'
import { SpinnerWheel } from './SpinnerWheel'
import { PlayerList } from './PlayerList'
import { FormationPitch } from './FormationPitch'
import { computeOverall } from '../../utils/ratings'
import { slotStatus, expandedAccepts } from '../../utils/positionRules'

function bestSlotFor(positions: string[], emptySlots: PositionSlot[]): PositionSlot | undefined {
  const natural = emptySlots.find(s => slotStatus(positions, s) === 'available' && positions.some(p => s.accepts[0] === p))
  if (natural) return natural
  const available = emptySlots.find(s => slotStatus(positions, s) === 'available')
  if (available) return available
  const penalty = emptySlots.find(s => slotStatus(positions, s) === 'penalty')
  if (penalty) return penalty
  return undefined
}

export function DraftPage() {
  const {
    formation, draftedPlayers, showRatings, rerollCount, draftMode,
    currentSpinClub, currentSpinSeason,
    setSpin, addPlayer, assignSlot, goToPhase, resetGame,
  } = useGameStore()

  const [rerollsUsed, setRerollsUsed] = useState(0)
  const [moveActive, setMoveActive] = useState(false)
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)

  const isPositionFirst = draftMode === 'position-first'

  const maxRerolls = rerollCount
  const canReroll = rerollsUsed < maxRerolls
  const rerollsLeft = maxRerolls - rerollsUsed
  const spinKey = draftedPlayers.length

  const f = getFormation(formation)
  const totalSlots = f.slots.length
  const filled = draftedPlayers.length

  const alreadyDrafted = draftedPlayers.map(d => ({ club: d.club, season: d.season }))
  const alreadyDraftedIds = draftedPlayers.map(d => d.player.id)

  const usedSlotIds = new Set(draftedPlayers.map(d => d.slotId))
  const emptySlots = f.slots.filter(s => !usedSlotIds.has(s.id))
  const selectedSlot = selectedSlotId ? f.slots.find(s => s.id === selectedSlotId) ?? null : null
  // Position-first: spinner only offers clubs that have players for the selected slot
  const neededPositions = isPositionFirst && selectedSlot
    ? expandedAccepts(selectedSlot.accepts)
    : Array.from(new Set(emptySlots.flatMap(s => expandedAccepts(s.accepts))))

  const handlePick = (drafted: DraftedPlayer) => {
    if (drafted.slotId !== null) {
      addPlayer(drafted)
    } else {
      const slot = bestSlotFor(drafted.player.positions, emptySlots)
      addPlayer({ ...drafted, slotId: slot?.id ?? null })
    }
    setSelectedSlotId(null)
    setSpin('', '')
  }

  const handleAssign = (playerId: string, slotId: string) => {
    const existing = draftedPlayers.find(d => d.slotId === slotId)
    const mover = draftedPlayers.find(d => d.player.id === playerId)
    if (existing && mover) {
      assignSlot(existing.player.id, mover.slotId ?? '')
    }
    assignSlot(playerId, slotId)
  }

  const handleReroll = () => {
    setRerollsUsed(n => n + 1)
    setSpin('', '')
    // In position-first, keep the slot selected so spinner re-filters correctly
  }

  const exitMoveMode = () => {
    setMoveActive(false)
    setMovingPlayerId(null)
  }

  const isDraftComplete = filled >= totalSlots

  const movingPlayer = movingPlayerId
    ? draftedPlayers.find(d => d.player.id === movingPlayerId)
    : null
  const movingSlot = movingPlayer?.slotId
    ? f.slots.find(s => s.id === movingPlayer.slotId)
    : null

  const validTargetSlotIds: Set<string> = movingPlayer
    ? new Set(
        f.slots
          .filter(s => s.id !== movingPlayer.slotId)
          .filter(s => slotStatus(movingPlayer.player.positions, s) !== 'unavailable')
          .map(s => s.id)
      )
    : new Set()

  const { overall, attack, midfield, defence, gk } = computeOverall(draftedPlayers)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Left: Pitch */}
      <div className="lg:w-72 xl:w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col p-3 gap-3">
        <div className="flex items-stretch justify-between gap-2">
          <div className="flex flex-col justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">Formation</p>
            <p className="text-base font-black text-white leading-none">{formation}</p>
          </div>
          {maxRerolls > 0 && (
            <div className="flex flex-col justify-between items-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">Rerolls</p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: maxRerolls }).map((_, i) => (
                  <span key={i} className={`inline-block w-2 h-2 rounded-full ${i < rerollsLeft ? 'bg-yellow-400' : 'bg-zinc-700'}`} />
                ))}
                <span className="text-[10px] text-zinc-500 ml-1">{rerollsLeft}/{maxRerolls}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col justify-between items-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">Players</p>
            <p className="text-[11px] font-bold text-zinc-400">{filled}/{totalSlots}</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={resetGame}
              className="text-[10px] text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded transition-colors"
            >
              ↺ Restart
            </button>
          </div>
        </div>

        <FormationPitch
          formation={formation}
          draftedPlayers={draftedPlayers}
          showRatings={showRatings}
          onAssign={handleAssign}
          moveActive={moveActive}
          movingPlayerId={movingPlayerId}
          validTargetSlotIds={validTargetSlotIds}
          onSelectForMove={setMovingPlayerId}
          selectedSlotId={isPositionFirst ? selectedSlotId : null}
          onSelectSlot={isPositionFirst && !moveActive ? setSelectedSlotId : undefined}
        />

        {/* Bottom panel */}
        {filled > 0 && (
          <>
            {/* Move player button — always visible when players exist */}
            {moveActive ? (
              <div className="mt-1 flex flex-col gap-2">
                <button
                  onClick={exitMoveMode}
                  className="w-full bg-amber-600/60 hover:bg-amber-600/80 text-amber-100 font-bold py-2 rounded-lg text-xs transition-colors border border-amber-700/40 uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  ⇄ Done Moving
                </button>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  {movingPlayer && movingSlot ? (
                    <><span className="text-amber-400/80 font-semibold">{movingPlayer.player.name}</span> selected. Tap a <span className="text-green-400 font-semibold">green</span> slot — empty slots free their <span className="text-zinc-300">{movingSlot.label}</span> spot, a filled slot swaps the two.</>
                  ) : (
                    'Select a player on the pitch to move them'
                  )}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setMoveActive(true)}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-2 rounded-lg text-xs transition-colors border border-zinc-700 hover:border-zinc-500 flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                ⇄ Move Player
              </button>
            )}

            {/* Stats block */}
            {!movingPlayerId && (
              <div className="space-y-1.5 pt-1 border-t border-zinc-800">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Overall</span>
                  <span className="text-lg font-black text-white">{overall}</span>
                </div>
                {([['Attack', attack, 'bg-red-500'], ['Midfield', midfield, 'bg-green-500'], ['Defence', defence, 'bg-blue-500'], ['GK', gk, 'bg-amber-500']] as [string, number, string][]).map(([label, val, barClass]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[11px] w-14">{label}</span>
                    <div className="flex-1 bg-zinc-800/80 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${barClass}`}
                        style={{ width: `${Math.max(0, ((val ?? 0) - 60) / 40 * 100)}%` }}
                      />
                    </div>
                    <span className="text-zinc-400 text-[11px] w-6 text-right tabular-nums">{val || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* Right: Spinner + Player Pick */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-xl">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1">
              {isDraftComplete ? 'Squad Complete' : 'Spin for a Squad'}
            </p>
            <h2 className="text-xl font-black">
              {isDraftComplete
                ? 'Arrange your players.'
                : `${totalSlots - filled} position${totalSlots - filled === 1 ? '' : 's'} left to fill`}
            </h2>
          </div>

          {!isDraftComplete && (
            <>
              {isPositionFirst && !selectedSlot ? (
                <div className="py-10 text-center">
                  <p className="text-zinc-600 text-sm">Tap an empty slot on the pitch</p>
                  <p className="text-zinc-700 text-xs mt-1">to choose a position, then spin</p>
                </div>
              ) : (
                <>
                  {isPositionFirst && selectedSlot && (
                    <div className="mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <p className="text-xs text-zinc-400">
                        Filling <span className="text-blue-400 font-bold">{selectedSlot.label} ({selectedSlot.accepts[0]})</span>
                      </p>
                      <button
                        onClick={() => { setSelectedSlotId(null); setSpin('', '') }}
                        className="ml-auto text-[10px] text-zinc-600 hover:text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  <SpinnerWheel
                    key={`${spinKey}-${selectedSlotId ?? ''}`}
                    onSpun={setSpin}
                    onReroll={handleReroll}
                    alreadyDrafted={alreadyDrafted}
                    eligible={{ positions: neededPositions, draftedIds: alreadyDraftedIds }}
                    disabled={false}
                    canReroll={canReroll}
                    rerollsLeft={rerollsLeft}
                  />

                  {currentSpinClub && currentSpinSeason && currentSpinClub.length > 0 && (
                    <div className="mt-5">
                      <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">
                        Players from <span className="text-white">{currentSpinClub}</span>
                        <span className="text-zinc-600 ml-2">· {currentSpinSeason}</span>
                      </p>
                      <PlayerList
                        club={currentSpinClub}
                        season={currentSpinSeason}
                        alreadyDraftedIds={alreadyDraftedIds}
                        emptySlots={isPositionFirst && selectedSlot ? [selectedSlot] : emptySlots}
                        onPick={handlePick}
                        autoAssignSlot={isPositionFirst && selectedSlot ? selectedSlot : undefined}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {draftedPlayers.length > 0 && (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Your Squad</p>
              <div className="flex flex-col gap-1">
                {draftedPlayers.map(dp => (
                  <div key={dp.player.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-zinc-900 rounded border border-zinc-800">
                    <span className="text-zinc-500 text-xs w-7">{dp.player.positions[0]}</span>
                    <span className="flex-1 text-white">{dp.player.name}</span>
                    <span className="text-zinc-600 text-xs">{dp.club}</span>
                    {showRatings && (
                      <span className={`font-bold text-xs w-7 text-right ${dp.rating >= 95 ? 'text-slate-200' : dp.rating >= 90 ? 'text-yellow-400' : dp.rating >= 85 ? 'text-green-400' : dp.rating >= 80 ? 'text-amber-400' : dp.rating >= 75 ? 'text-zinc-400' : 'text-red-500'}`}>
                        {dp.rating}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {isDraftComplete && (
                <button
                  onClick={() => goToPhase('squad')}
                  className="w-full mt-2 bg-red-600/85 hover:bg-red-500/85 text-white font-black py-2.5 rounded-lg text-sm transition-colors uppercase tracking-wide"
                >
                  Submit Squad →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
