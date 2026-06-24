import { useMemo } from 'react'
import { useGameStore } from '../../store/gameStore'
import { FormationPitch } from '../draft/FormationPitch'
import { computeOverall } from '../../utils/ratings'
import { computeOdds } from '../../utils/odds'
import { simulateSeason } from '../../utils/simulation'
import { motion } from 'framer-motion'

const POSITION_COLORS: Record<string, string> = {
  GK: 'bg-amber-500', CB: 'bg-blue-600', LB: 'bg-blue-600', RB: 'bg-blue-600', LWB: 'bg-blue-600', RWB: 'bg-blue-600',
  DM: 'bg-green-700', CM: 'bg-green-700', AM: 'bg-green-600', LM: 'bg-green-600', RM: 'bg-green-600',
  LW: 'bg-red-600', RW: 'bg-red-600', ST: 'bg-red-600', CF: 'bg-red-600',
}

export function SquadSummary() {
  const { draftedPlayers, formation, showRatings, assignSlot, goToPhase, setSimulationResult } = useGameStore()

  const { overall, attack, midfield, defence, gk } = computeOverall(draftedPlayers)
  // Monte-Carlo odds are expensive; only recompute when the squad's overall changes.
  const odds = useMemo(() => computeOdds(overall), [overall])

  const handleSimulate = () => {
    const result = simulateSeason(overall, draftedPlayers)
    setSimulationResult(result, overall)
  }

  const orderedPlayers = [...draftedPlayers].sort((a, b) => {
    const order = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'DM', 'CM', 'LM', 'RM', 'AM', 'LW', 'RW', 'ST', 'CF']
    return order.indexOf(a.player.positions[0]) - order.indexOf(b.player.positions[0])
  })

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Left: Pitch */}
      <div className="lg:w-72 xl:w-80 bg-zinc-950 border-r border-zinc-800 p-3 flex flex-col gap-3">
        <div className="text-xs text-zinc-400 uppercase tracking-widest">{formation}</div>
        <FormationPitch
          formation={formation}
          draftedPlayers={draftedPlayers}
          showRatings={showRatings}
          onAssign={(id, slot) => assignSlot(id, slot)}
        />
        <div className="mt-2 space-y-1">
          {([['Attack', attack, 'bg-red-500'], ['Midfield', midfield, 'bg-green-500'], ['Defence', defence, 'bg-blue-500'], ['GK', gk, 'bg-amber-500']] as [string, number, string][]).map(([label, val, barClass]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-zinc-500 text-xs w-14">{label}</span>
              <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${barClass}`} style={{ width: `${(val - 60) / 40 * 100}%` }} />
              </div>
              <span className="text-zinc-400 text-xs w-6 text-right">{val || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 p-4 lg:p-8 max-w-2xl">
        <div className="mb-2">
          <h1 className="text-2xl font-bold">Your XI</h1>
          <p className="text-zinc-400 text-sm">{formation} — Overall {overall}</p>
        </div>

        {/* Player list */}
        <div className="flex flex-col gap-1 mb-6">
          {orderedPlayers.map((dp, i) => (
            <motion.div
              key={dp.player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded border border-zinc-800"
            >
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${POSITION_COLORS[dp.player.positions[0]] ?? 'bg-zinc-600'} text-white w-8 text-center`}>
                {dp.player.positions[0]}
              </span>
              <span className="flex-1 text-white text-sm font-medium">{dp.player.name}</span>
              <span className="text-zinc-500 text-xs">{dp.club} {dp.season.split('-')[0]}/{dp.season.split('-')[1].slice(-2)}</span>
              {showRatings && (
                <span className={`text-sm font-bold w-7 text-right ${dp.rating >= 95 ? 'text-purple-400' : dp.rating >= 90 ? 'text-sky-300' : dp.rating >= 85 ? 'text-emerald-400' : dp.rating >= 80 ? 'text-yellow-400' : dp.rating >= 75 ? 'text-slate-400' : 'text-amber-600'}`}>
                  {dp.rating}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trophy icon */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-1">🏆</div>
          <p className="text-white font-bold text-lg">Squad Complete</p>
          <p className="text-zinc-400 text-sm">Here's what the bookies make of your XI.</p>
        </div>

        {/* Preseason odds */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-xs text-zinc-500 uppercase tracking-widest mb-3">
            <span>Pre-Season Odds</span>
            <span>Champions League 25/26</span>
          </div>
          <div className="flex justify-between items-baseline mb-3">
            <div>
              <div className="text-xs text-zinc-500">Projected</div>
              <div className="text-2xl font-bold text-white">{odds.projectedFinish}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500">Expected Points</div>
              <div className="text-2xl font-bold text-green-400">{odds.expectedPoints}</div>
            </div>
          </div>

          {[
            { label: 'Win the UCL', pct: odds.winLeague, color: 'bg-green-500' },
            { label: 'Top 8 (Auto R16)', pct: odds.top8, color: 'bg-blue-500' },
            { label: 'Top 24 (Qualify)', pct: odds.top24, color: 'bg-purple-500' },
            { label: 'Elimination (LP)', pct: odds.eliminated, color: 'bg-red-600' },
          ].map(({ label, pct, color }) => (
            <div key={label} className="mb-2">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-zinc-400">{label}</span>
                <span className="text-zinc-300">{pct}%</span>
              </div>
              <div className="bg-zinc-800 rounded-full h-2">
                <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSimulate}
          className="w-full bg-red-600/85 hover:bg-red-500/85 text-white font-black py-4 rounded-lg text-lg transition-colors mb-3 uppercase tracking-wide"
        >
          Simulate Season →
        </button>
        <button
          onClick={() => goToPhase('draft')}
          className="w-full bg-transparent border border-zinc-700/80 text-zinc-400 hover:text-white py-2.5 rounded-lg text-sm transition-colors"
        >
          ↩ Restart — start a new run
        </button>
      </div>
    </div>
  )
}
