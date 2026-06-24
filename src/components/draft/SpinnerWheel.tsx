import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { spinClubSeason } from '../../utils/spinner'

type Props = {
  onSpun: (club: string, season: string) => void
  onReroll?: () => void
  alreadyDrafted: { club: string; season: string }[]
  eligible?: { positions: string[]; draftedIds: string[] }
  disabled?: boolean
  canReroll?: boolean
  rerollsLeft?: number
}

const FAKE_SPINS = [
  ['Real Madrid', '2013-14'],
  ['Barcelona', '2010-11'],
  ['Bayern Munich', '2019-20'],
  ['Liverpool', '2018-19'],
  ['Chelsea', '2011-12'],
  ['Manchester United', '1998-99'],
  ['AC Milan', '2006-07'],
  ['Juventus', '2016-17'],
  ['Paris Saint-Germain', '2020-21'],
  ['Inter Milan', '2009-10'],
  ['Borussia Dortmund', '2012-13'],
  ['Atletico Madrid', '2015-16'],
]

export function SpinnerWheel({ onSpun, onReroll, alreadyDrafted, eligible, disabled, canReroll, rerollsLeft }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [displayIdx, setDisplayIdx] = useState(0)
  const [result, setResult] = useState<{ club: string; season: string } | null>(null)

  const runSpin = () => {
    setSpinning(true)
    setResult(null)

    const final = spinClubSeason(alreadyDrafted, eligible)
    let ticks = 0
    const maxTicks = 18 + Math.floor(Math.random() * 8)

    const interval = setInterval(() => {
      setDisplayIdx(i => (i + 1) % FAKE_SPINS.length)
      ticks++
      if (ticks >= maxTicks) {
        clearInterval(interval)
        setResult(final)
        setSpinning(false)
      }
    }, 80)
  }

  useEffect(() => {
    if (result) onSpun(result.club, result.season)
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpin = () => {
    if (spinning || disabled || result) return
    runSpin()
  }

  const handleReroll = () => {
    if (spinning || !canReroll) return
    setResult(null)
    onReroll?.()
    setTimeout(runSpin, 100)
  }

  const current = result ?? (FAKE_SPINS[displayIdx] ? { club: FAKE_SPINS[displayIdx][0], season: FAKE_SPINS[displayIdx][1] } : null)
  const isIdle = !spinning && !result

  return (
    <div className="w-full max-w-md">
      {/* Display panel */}
      <div className={`flex items-center rounded-lg border transition-colors ${result ? 'border-zinc-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-950'}`}>
        {/* Club */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600 mb-0.5">Club</p>
          {isIdle ? (
            <p className="text-zinc-700 text-sm font-medium">—</p>
          ) : result ? (
            <motion.p
              key="club-result"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="text-white font-semibold text-sm leading-tight truncate"
            >
              {result.club}
            </motion.p>
          ) : (
            <p className="text-zinc-400 font-semibold text-sm leading-tight truncate">{current?.club}</p>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-zinc-800 flex-shrink-0" />

        {/* Season */}
        <div className="px-4 py-3 flex-shrink-0 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600 mb-0.5">Season</p>
          {isIdle ? (
            <p className="text-zinc-700 text-sm font-medium">—</p>
          ) : result ? (
            <motion.p
              key="season-result"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0.04 }}
              className="text-red-400 font-semibold text-sm tabular-nums"
            >
              {result.season}
            </motion.p>
          ) : (
            <p className="text-zinc-400 font-semibold text-sm tabular-nums">{current?.season}</p>
          )}
        </div>

        {/* Spin / Re-roll controls inline */}
        <div className="flex items-center gap-1 pr-2 pl-1 flex-shrink-0">
          <button
            onClick={handleSpin}
            disabled={spinning || disabled || !!result}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
              result
                ? 'bg-zinc-800 text-zinc-500 cursor-default'
                : spinning
                ? 'bg-zinc-800 text-zinc-500'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {spinning ? '…' : result ? '✓' : 'Spin'}
          </button>

          {canReroll && result && !spinning && (
            <button
              onClick={handleReroll}
              title={`Re-roll (${rerollsLeft} left)`}
              className="px-2.5 py-1.5 rounded-md text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all"
            >
              ↺ {rerollsLeft}
            </button>
          )}
        </div>
      </div>

      {/* Subtle hint line */}
      <p className="text-[11px] text-zinc-700 mt-1.5 text-center">
        {result ? 'Pick a player below' : isIdle ? 'tap to spin, or press Space' : ''}
      </p>
    </div>
  )
}
