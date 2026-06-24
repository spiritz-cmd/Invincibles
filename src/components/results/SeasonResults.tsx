import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { FormationPitch } from '../draft/FormationPitch'
import { computeOverall } from '../../utils/ratings'
import type { MatchResult, TeamStanding, DraftedPlayer } from '../../store/gameStore'

const STAGE_COLORS: Record<string, string> = {
  'League Phase': 'text-zinc-400',
  'Playoff': 'text-blue-400',
  'Round of 16': 'text-purple-400',
  'Quarter-Final': 'text-yellow-400',
  'Semi-Final': 'text-orange-400',
  'Final': 'text-green-400',
}

type Tie = { stage: string; opponent: string; legs: MatchResult[]; aggFor: number; aggAgainst: number }
type TieOutcome = 'advanced' | 'winners' | 'runner-up' | 'eliminated'

function groupTies(results: MatchResult[]): Tie[] {
  const ties: Tie[] = []
  for (const m of results) {
    const last = ties[ties.length - 1]
    if (last && last.stage === m.stage) {
      last.legs.push(m); last.aggFor += m.goalsFor; last.aggAgainst += m.goalsAgainst
    } else {
      ties.push({ stage: m.stage, opponent: m.opponent, legs: [m], aggFor: m.goalsFor, aggAgainst: m.goalsAgainst })
    }
  }
  return ties
}

const OUTCOME_META: Record<TieOutcome, { label: string; box: string; text: string }> = {
  advanced:    { label: 'Advanced',  box: 'bg-green-950 border-green-900',  text: 'text-green-400' },
  winners:     { label: 'Champions', box: 'bg-yellow-950 border-yellow-600', text: 'text-green-400' },
  'runner-up': { label: 'Runner-Up', box: 'bg-zinc-900 border-zinc-700',    text: 'text-zinc-300' },
  eliminated:  { label: 'Eliminated',box: 'bg-red-950 border-red-900',      text: 'text-red-400' },
}

function KnockoutTie({ tie, outcome, idx }: { tie: Tie; outcome: TieOutcome; idx: number }) {
  const meta = OUTCOME_META[outcome]
  const single = tie.legs.length === 1
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
      className={`px-3 py-2.5 rounded border mb-1 ${meta.box}`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs uppercase tracking-widest w-24 flex-shrink-0 ${STAGE_COLORS[tie.stage] ?? 'text-zinc-500'}`}>{tie.stage}</span>
        <span className="flex-1 text-sm text-white font-medium">{tie.opponent}</span>
        {!single && <span className="text-xs text-zinc-500">{tie.legs.map(l => `${l.goalsFor}–${l.goalsAgainst}`).join(' , ')}</span>}
        <span className="text-sm font-bold text-white w-16 text-right">{single ? `${tie.aggFor}–${tie.aggAgainst}` : `Agg ${tie.aggFor}–${tie.aggAgainst}`}</span>
        <span className={`text-xs font-bold w-20 text-right ${meta.text}`}>{meta.label}</span>
      </div>
    </motion.div>
  )
}

function MatchRow({ match, idx }: { match: MatchResult; idx: number }) {
  const won = match.goalsFor > match.goalsAgainst
  const drew = match.goalsFor === match.goalsAgainst
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className={`px-3 py-2.5 rounded border mb-1 ${won ? 'bg-green-950 border-green-900' : drew ? 'bg-yellow-950/75 border-yellow-800/75' : 'bg-red-950 border-red-900'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs uppercase tracking-widest w-20 flex-shrink-0 ${STAGE_COLORS[match.stage] ?? 'text-zinc-500'}`}>
          {match.stage}{match.leg ? ` L${match.leg}` : ''}
        </span>
        <span className="flex-1 text-sm text-white font-medium">{match.opponent}</span>
        <span className={`text-sm font-bold ${won ? 'text-green-400' : drew ? 'text-yellow-400' : 'text-red-400'}`}>
          {match.goalsFor}–{match.goalsAgainst}
        </span>
        <span className={`text-xs font-bold w-5 text-center rounded ${won ? 'text-green-400' : drew ? 'text-yellow-400' : 'text-red-400'}`}>
          {won ? 'W' : drew ? 'D' : 'L'}
        </span>
      </div>
      {match.scorers.length > 0 && (
        <div className="text-xs text-zinc-500 mt-0.5 ml-[88px]">{match.scorers.join(', ')}</div>
      )}
    </motion.div>
  )
}

function zoneColor(pos: number): string {
  if (pos <= 8) return 'border-l-green-500'
  if (pos <= 24) return 'border-l-blue-500'
  return 'border-l-red-600'
}

function LeagueTable({ table }: { table: TeamStanding[] }) {
  return (
    <div className="lg:w-80 xl:w-96 bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-800 p-3 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-zinc-400">League Phase Table</span>
        <span className="text-[10px] text-zinc-600">25/26</span>
      </div>
      <div className="flex items-center gap-2 px-2 py-1 text-[10px] text-zinc-500 uppercase">
        <span className="w-5">#</span><span className="flex-1">Club</span>
        <span className="w-5 text-center">P</span><span className="w-8 text-center">GD</span><span className="w-6 text-right">Pts</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {table.map((t, i) => {
          const pos = i + 1, gd = t.gf - t.ga
          return (
            <div key={t.name} className={`flex items-center gap-2 px-2 py-1 rounded-sm border-l-2 ${zoneColor(pos)} ${t.isUser ? 'bg-yellow-500/10 ring-1 ring-yellow-500/40' : 'bg-zinc-900'}`}>
              <span className="w-5 text-xs text-zinc-500">{pos}</span>
              <span className={`flex-1 text-xs truncate ${t.isUser ? 'text-yellow-300 font-bold' : 'text-zinc-200'}`}>{t.name}</span>
              <span className="w-5 text-center text-[11px] text-zinc-500">{t.played}</span>
              <span className="w-8 text-center text-[11px] text-zinc-400">{gd > 0 ? `+${gd}` : gd}</span>
              <span className="w-6 text-right text-xs font-bold text-white">{t.points}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 space-y-1 text-[10px] text-zinc-500">
        <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-sm" /> 1–8 · Auto Round of 16</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-sm" /> 9–24 · Knockout Playoff</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 bg-red-600 rounded-sm" /> 25–36 · Eliminated</div>
      </div>
    </div>
  )
}

// ─── Share card canvas helpers ────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

const POS_CANVAS_BG: Record<string, string> = {
  GK: '#d97706',
  CB: '#2563eb', LB: '#2563eb', RB: '#2563eb', LWB: '#2563eb', RWB: '#2563eb',
  DM: '#15803d', CM: '#15803d', AM: '#16a34a', LM: '#16a34a', RM: '#16a34a',
  LW: '#dc2626', RW: '#dc2626', ST: '#dc2626', CF: '#dc2626',
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}

interface ShareParams {
  totalW: number; totalD: number; totalL: number
  totalGF: number; totalGA: number; totalPts: number
  position: number; overall: number; formation: string; ratingsMode: string
  players: DraftedPlayer[]; showRatings: boolean
  goldenBoot: [string, number] | null
  goldenGlove: [string, number] | null
  pots: [string, number] | null
  finalPosition: string; won: boolean; perfectRun: boolean
}

function generateShareImage(p: ShareParams): string {
  const W = 390
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const ROW = 22
  const half = Math.ceil(p.players.length / 2)
  const playerRows = Math.max(half, p.players.length - half)
  const awardRows = ((p.goldenBoot || p.goldenGlove) ? 1 : 0) + 1
  const H = 24 + 44 + 91 + 15 + 1 + 16 + playerRows * ROW + 16 + 1 + 16 + awardRows * 64 + 28

  const canvas = document.createElement('canvas')
  canvas.width = W * dpr; canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#09090b'
  ctx.fillRect(0, 0, W, H)

  let y = 24

  // Header
  ctx.fillStyle = '#ef4444'
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
  ctx.fillText('INVINCIBLES', 24, y + 13)
  ctx.fillStyle = '#71717a'
  ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${p.formation}  ·  ${p.ratingsMode === 'prime' ? 'Prime' : 'Career'}`, 24, y + 28)
  const ovrLabel = `OVR ${p.overall}`
  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif'
  const ovrTW = ctx.measureText(ovrLabel).width + 16
  ctx.fillStyle = '#27272a'; rrect(ctx, W - 24 - ovrTW, y + 2, ovrTW, 20, 4); ctx.fill()
  ctx.fillStyle = '#e4e4e7'; ctx.fillText(ovrLabel, W - 24 - ovrTW + 8, y + 15)
  y += 44

  // Record — three aligned columns so each label sits directly under its number
  const recordCols = [
    { val: p.totalW, label: 'WON' },
    { val: p.totalD, label: 'DRAWN' },
    { val: p.totalL, label: 'LOST' },
  ]
  const colW3 = (W - 48) / 3
  ctx.textAlign = 'center'
  recordCols.forEach(({ val, label }, i) => {
    const cx = 24 + colW3 * i + colW3 / 2
    ctx.font = 'bold 50px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(String(val), cx, y + 50)
    ctx.font = '10px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#71717a'
    ctx.fillText(label, cx, y + 66)
  })
  y += 91
  const shortResult = p.finalPosition.replace(/ \(.*\)$/, '')
  ctx.fillStyle = '#d4d4d8'; ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  let ptsLine = `${p.totalPts} pts  ·  Finished ${ordinal(p.position)}  ·  ${shortResult}`
  while (ptsLine.length > 1 && ctx.measureText(ptsLine).width > W - 48) ptsLine = ptsLine.slice(0, -1)
  ctx.fillText(ptsLine, W / 2, y); y += 15
  ctx.textAlign = 'left'

  // Divider
  ctx.strokeStyle = '#27272a'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(W - 24, y); ctx.stroke(); y += 16

  // Players 2 cols
  const posOrder = ['GK','CB','LB','RB','LWB','RWB','DM','CM','LM','RM','AM','LW','RW','ST','CF']
  const sorted = [...p.players].sort((a, b) =>
    posOrder.indexOf(a.player.positions[0]) - posOrder.indexOf(b.player.positions[0])
  )
  const col1 = sorted.slice(0, half)
  const col2 = sorted.slice(half)
  const colW = (W - 48 - 12) / 2

  const drawPlayer = (dp: DraftedPlayer, x: number, py: number) => {
    const pos = dp.player.positions[0]
    ctx.fillStyle = POS_CANVAS_BG[pos] ?? '#52525b'
    rrect(ctx, x, py + 2, 26, 16, 3); ctx.fill()
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'; ctx.fillText(pos, x + 13, py + 13); ctx.textAlign = 'left'
    ctx.fillStyle = '#e4e4e7'; ctx.font = '11px system-ui, -apple-system, sans-serif'
    const maxW = colW - 32 - (p.showRatings ? 24 : 0)
    let name = dp.player.name
    while (name.length > 1 && ctx.measureText(name).width > maxW) name = name.slice(0, -1)
    if (name !== dp.player.name) name += '…'
    ctx.fillText(name, x + 30, py + 13)
    if (p.showRatings) {
      const r = dp.rating
      ctx.fillStyle = r >= 95 ? '#c084fc' : r >= 90 ? '#7dd3fc' : r >= 85 ? '#34d399' : r >= 80 ? '#facc15' : r >= 75 ? '#94a3b8' : '#d97706'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'right'; ctx.fillText(String(r), x + colW, py + 13); ctx.textAlign = 'left'
    }
  }

  col1.forEach((dp, i) => drawPlayer(dp, 24, y + i * ROW))
  col2.forEach((dp, i) => drawPlayer(dp, 24 + colW + 12, y + i * ROW))
  y += Math.max(col1.length, col2.length) * ROW + 16

  // Divider
  ctx.strokeStyle = '#27272a'
  ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(W - 24, y); ctx.stroke(); y += 16

  // Awards
  const drawAward = (icon: string, title: string, name: string, stat: string, x: number, ay: number, w: number) => {
    ctx.fillStyle = '#18181b'; rrect(ctx, x, ay, w, 56, 6); ctx.fill()
    ctx.fillStyle = '#52525b'; ctx.font = '9px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${icon}  ${title}`, x + 10, ay + 14)
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
    let n = name
    while (n.length > 1 && ctx.measureText(n).width > w - 20) n = n.slice(0, -1)
    if (n !== name) n += '…'
    ctx.fillText(n, x + 10, ay + 30)
    ctx.fillStyle = '#71717a'; ctx.font = '10px system-ui, -apple-system, sans-serif'
    ctx.fillText(stat, x + 10, ay + 44)
  }

  if (p.goldenBoot || p.goldenGlove) {
    const both = !!(p.goldenBoot && p.goldenGlove)
    const aW = both ? (W - 48 - 12) / 2 : W - 48
    if (p.goldenBoot) drawAward('⚽', 'GOLDEN BOOT', p.goldenBoot[0], `${p.goldenBoot[1]} goals`, 24, y, aW)
    if (p.goldenGlove) drawAward('🧤', 'GOLDEN GLOVE', p.goldenGlove[0], `${p.goldenGlove[1]} clean sheets`, both ? 24 + aW + 12 : 24, y, aW)
    y += 64
  }

  // Bottom row: PoTS (half) + Result tile (half)
  const halfW = (W - 48 - 12) / 2
  if (p.pots) drawAward('⭐', 'PLAYER OF THE SEASON', p.pots[0], `${p.pots[1]} goals`, 24, y, halfW)

  // Result tile
  const rx = 24 + halfW + 12
  const isChamp = p.won
  const isPerfect = p.perfectRun
  const isElim = p.finalPosition.startsWith('Eliminated')
  const rtBg = isPerfect ? '#2a1800' : isChamp ? '#1a1200' : isElim ? '#1a0808' : '#18181b'
  const rtBorder = isPerfect ? '#d97706' : isChamp ? '#a16207' : isElim ? '#7f1d1d' : '#52525b'
  const rtColor = isPerfect ? '#fde047' : isChamp ? '#fbbf24' : isElim ? '#f87171' : '#d4d4d4'
  const rtIcon = isPerfect ? '★' : isChamp ? '🏆' : isElim ? '⚽' : '🥈'
  const rtLabel = isPerfect ? 'PERFECT RUN' : isChamp ? 'CHAMPIONS' : isElim ? shortResult.replace(/^Eliminated in /, '') : 'RUNNER-UP'
  const rtSub = isPerfect ? '15W · 0D · 0L' : isChamp ? 'League Winner' : isElim ? 'Eliminated' : p.finalPosition.replace(/^Runner-Up \(Final vs /, 'vs ').replace(/\)$/, '')
  ctx.fillStyle = rtBg; rrect(ctx, rx, y, halfW, 56, 6); ctx.fill()
  ctx.strokeStyle = rtBorder; ctx.lineWidth = 1; rrect(ctx, rx, y, halfW, 56, 6); ctx.stroke()
  ctx.fillStyle = '#52525b'; ctx.font = '9px system-ui, -apple-system, sans-serif'
  ctx.fillText(`${rtIcon}  FINAL RESULT`, rx + 10, y + 14)
  ctx.fillStyle = rtColor; ctx.font = 'bold 12px system-ui, -apple-system, sans-serif'
  let rl = rtLabel
  while (rl.length > 1 && ctx.measureText(rl).width > halfW - 20) rl = rl.slice(0, -1)
  if (rl !== rtLabel) rl += '…'
  ctx.fillText(rl, rx + 10, y + 30)
  ctx.fillStyle = '#71717a'; ctx.font = '10px system-ui, -apple-system, sans-serif'
  ctx.fillText(rtSub, rx + 10, y + 44)
  y += 64

  // Footer
  ctx.fillStyle = '#3f3f46'; ctx.font = '9px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('INVINCIBLES  ·  Champions League Draft', W / 2, y + 12)

  return canvas.toDataURL('image/png')
}

// ─── Main component ───────────────────────────────────────────────────────────

const POS_COLORS: Record<string, string> = {
  GK: 'bg-amber-600', CB: 'bg-blue-700', LB: 'bg-blue-700', RB: 'bg-blue-700', LWB: 'bg-blue-700', RWB: 'bg-blue-700',
  DM: 'bg-green-800', CM: 'bg-green-800', AM: 'bg-green-700', LM: 'bg-green-700', RM: 'bg-green-700',
  LW: 'bg-red-700', RW: 'bg-red-700', ST: 'bg-red-700', CF: 'bg-red-700',
}

const DEFENDER_POSITIONS = new Set(['GK','CB','LB','RB','LWB','RWB'])

export function SeasonResults() {
  const { simulationResult, draftedPlayers, formation, showRatings, ratingsMode, overallRating, assignSlot, resetGame } = useGameStore()
  const [shareImage, setShareImage] = useState<string | null>(null)

  if (!simulationResult) return null

  const { leaguePhaseResults, leaguePhasePosition, leaguePhasePoints, leaguePhaseGF, leaguePhaseGA,
    advancedAs, knockoutResults, finalPosition, won, leagueTable } = simulationResult

  const { attack, midfield, defence, gk } = computeOverall(draftedPlayers)

  const lpW = leaguePhaseResults.filter(m => m.goalsFor > m.goalsAgainst).length
  const lpD = leaguePhaseResults.filter(m => m.goalsFor === m.goalsAgainst).length
  const lpL = leaguePhaseResults.filter(m => m.goalsFor < m.goalsAgainst).length

  const allResults = [...leaguePhaseResults, ...knockoutResults]
  const totalW = allResults.filter(m => m.goalsFor > m.goalsAgainst).length
  const totalD = allResults.filter(m => m.goalsFor === m.goalsAgainst).length
  const totalL = allResults.filter(m => m.goalsFor < m.goalsAgainst).length
  const totalGF = allResults.reduce((s, m) => s + m.goalsFor, 0)
  const totalGA = allResults.reduce((s, m) => s + m.goalsAgainst, 0)
  const cleanSheetCount = allResults.filter(m => m.goalsAgainst === 0).length

  // Per-player goals from scorer arrays
  const goalsByPlayer: Record<string, number> = {}
  for (const m of allResults) {
    for (const s of m.scorers) goalsByPlayer[s] = (goalsByPlayer[s] ?? 0) + 1
  }

  const sortedScorers = Object.entries(goalsByPlayer).sort((a, b) => b[1] - a[1])
  const goldenBoot: [string, number] | null = sortedScorers[0] ?? null
  const gkPlayer = draftedPlayers.find(dp => dp.player.positions[0] === 'GK')
  const goldenGlove: [string, number] | null = gkPlayer ? [gkPlayer.player.name, cleanSheetCount] : null
  const pots: [string, number] | null = goldenBoot

  const ties = groupTies(knockoutResults)
  const tieOutcomes: TieOutcome[] = ties.map((tie, i) => {
    if (i < ties.length - 1) return 'advanced'
    if (tie.stage === 'Final') return won ? 'winners' : 'runner-up'
    return 'eliminated'
  })

  const perfectRun = won && totalW === 15 && totalD === 0 && totalL === 0

  const posOrder = ['GK','CB','LB','RB','LWB','RWB','DM','CM','LM','RM','AM','LW','RW','ST','CF']
  const orderedPlayers = [...draftedPlayers].sort((a, b) =>
    posOrder.indexOf(a.player.positions[0]) - posOrder.indexOf(b.player.positions[0])
  )

  const handleOpenShare = () => {
    const dataUrl = generateShareImage({
      totalW, totalD, totalL, totalGF, totalGA,
      totalPts: leaguePhasePoints,
      position: leaguePhasePosition,
      overall: overallRating,
      formation, ratingsMode,
      players: orderedPlayers,
      showRatings,
      goldenBoot, goldenGlove, pots,
      finalPosition, won, perfectRun,
    })
    setShareImage(dataUrl)
  }

  const handleDownload = () => {
    if (!shareImage) return
    const a = document.createElement('a')
    a.href = shareImage
    a.download = `invincibles-${totalW}-${totalD}-${totalL}.png`
    a.click()
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Left pitch */}
      <div className="lg:w-72 xl:w-80 bg-zinc-950 border-r border-zinc-800 p-3 flex flex-col gap-3">
        <div className="text-xs text-zinc-400 uppercase tracking-widest">{formation}</div>
        <FormationPitch
          formation={formation}
          draftedPlayers={draftedPlayers}
          showRatings={showRatings}
          onAssign={(id, slot) => assignSlot(id, slot)}
          compact
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
        <div className="bg-zinc-900 rounded p-2 text-center">
          <div className="text-xs text-zinc-500">Overall</div>
          <div className="text-2xl font-bold text-white">{overallRating}</div>
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-2xl">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-xl font-bold">Your XI</h1>
          <span className="text-zinc-400 text-sm">{formation} — Overall {overallRating}</span>
        </div>

        {/* Squad compact */}
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-6 text-xs text-zinc-400">
          {draftedPlayers.map(dp => (
            <span key={dp.player.id}>
              <span className="text-zinc-600">{dp.player.positions[0]} </span>
              <span className="text-zinc-300">{dp.player.name}</span>
              {showRatings && <span className={`ml-1 ${dp.rating >= 95 ? 'text-purple-400' : dp.rating >= 90 ? 'text-sky-300' : dp.rating >= 85 ? 'text-emerald-400' : dp.rating >= 80 ? 'text-yellow-400' : dp.rating >= 75 ? 'text-slate-400' : 'text-amber-600'}`}>{dp.rating}</span>}
            </span>
          ))}
        </div>

        {/* Final result banner */}
        {perfectRun ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl p-6 text-center mb-6 border-2 border-yellow-400 bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-950 shadow-lg shadow-yellow-900/40"
          >
            <div className="text-5xl mb-2">🏆✨</div>
            <div className="text-2xl font-extrabold text-yellow-300 tracking-tight">PERFECT RUN</div>
            <div className="text-sm font-bold text-yellow-200 mt-1">Champions League Winners — 15W&nbsp;0D&nbsp;0L</div>
            <div className="text-xs text-yellow-100/70 mt-2">Won every single game from the League Phase to the Final. Untouchable.</div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`rounded-xl p-6 text-center mb-6 border ${won ? 'bg-yellow-950 border-yellow-600' : 'bg-zinc-900 border-zinc-700'}`}
          >
            <div className="text-4xl mb-2">{won ? '🏆' : advancedAs === 'eliminated' ? '❌' : '⚽'}</div>
            <div className={`text-xl font-bold ${won ? 'text-yellow-400' : 'text-white'}`}>{finalPosition}</div>
          </motion.div>
        )}

        {/* League phase */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-widest text-zinc-500">League Phase</span>
            <span className="text-xs text-zinc-400">{leaguePhasePoints} pts · {lpW}W {lpD}D {lpL}L · {leaguePhaseGF}:{leaguePhaseGA}</span>
          </div>
          <div className="text-xs text-zinc-500 mb-2">
            Finished {leaguePhasePosition}{['st','nd','rd'][leaguePhasePosition - 1] ?? 'th'} — {advancedAs === 'direct' ? 'Auto R16' : advancedAs === 'playoff' ? 'Playoff' : 'Eliminated'}
          </div>
          {leaguePhaseResults.map((m, i) => <MatchRow key={i} match={m} idx={i} />)}
        </div>

        {/* Knockout */}
        {ties.length > 0 && (
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Knockout Stage</div>
            {ties.map((tie, i) => <KnockoutTie key={tie.stage + i} tie={tie} outcome={tieOutcomes[i]} idx={i} />)}
          </div>
        )}

        {/* ── Season summary ── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Wins',         val: totalW,  color: 'text-green-400' },
            { label: 'Draws',        val: totalD,  color: 'text-yellow-400' },
            { label: 'Losses',       val: totalL,  color: 'text-red-400' },
            { label: 'Points',       val: leaguePhasePoints, color: 'text-white' },
            { label: 'Goals For',    val: totalGF, color: 'text-green-400' },
            { label: 'Goals Against',val: totalGA, color: 'text-red-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className={`text-2xl font-black ${color}`}>{val}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* Share button */}
        <button
          onClick={handleOpenShare}
          className="w-full bg-red-600/85 hover:bg-red-500/85 text-white font-black py-3 rounded-lg text-sm transition-colors uppercase tracking-widest mb-4 flex items-center justify-center gap-2"
        >
          📸 Save Season Card
        </button>

        {/* Share modal */}
        {shareImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShareImage(null)}
          >
            <div
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 max-w-sm w-full flex flex-col gap-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-zinc-500">Season Card</span>
                <button onClick={() => setShareImage(null)} className="text-zinc-600 hover:text-white text-lg leading-none">✕</button>
              </div>
              <img src={shareImage} alt="Season card" className="w-full rounded-lg" />
              <button
                onClick={handleDownload}
                className="w-full bg-red-600/85 hover:bg-red-500/85 text-white font-black py-2.5 rounded-lg text-sm transition-colors uppercase tracking-widest"
              >
                ↓ Download Image
              </button>
            </div>
          </div>
        )}

        {/* Season awards */}
        {(goldenBoot || goldenGlove) && (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Season Awards</div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {goldenBoot && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">⚽ Golden Boot</div>
                  <div className="text-sm font-bold text-white leading-tight">{goldenBoot[0]}</div>
                  <div className="text-[11px] text-yellow-400 mt-0.5">{goldenBoot[1]} goals</div>
                </div>
              )}
              {goldenGlove && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">🧤 Golden Glove</div>
                  <div className="text-sm font-bold text-white leading-tight">{goldenGlove[0]}</div>
                  <div className="text-[11px] text-blue-400 mt-0.5">{goldenGlove[1]} clean sheets</div>
                </div>
              )}
            </div>
            {pots && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">⭐ Player of the Season</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">{pots[0]}</span>
                  <span className="text-[11px] text-yellow-400">{pots[1]} goals</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player stats table */}
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Player Stats</div>
          <div className="flex items-center gap-2 px-2 py-1 text-[9px] text-zinc-600 uppercase tracking-widest border-b border-zinc-900">
            <span className="w-7" />
            <span className="flex-1">Player</span>
            <span className="w-6 text-center">G</span>
            <span className="w-8 text-center">CS</span>
          </div>
          {[...orderedPlayers].sort((a, b) => (goalsByPlayer[b.player.name] ?? 0) - (goalsByPlayer[a.player.name] ?? 0)).map(dp => {
            const goals = goalsByPlayer[dp.player.name] ?? 0
            const isDef = DEFENDER_POSITIONS.has(dp.player.positions[0])
            return (
              <div key={dp.player.id} className="flex items-center gap-2 px-2 py-1.5 border-b border-zinc-900/60 last:border-0">
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded text-white w-7 text-center ${POS_COLORS[dp.player.positions[0]] ?? 'bg-zinc-700'}`}>
                  {dp.player.positions[0]}
                </span>
                <span className="flex-1 text-xs text-zinc-200">{dp.player.name}</span>
                <span className={`w-6 text-center text-xs font-bold ${goals > 0 ? 'text-green-400' : 'text-zinc-700'}`}>
                  {goals > 0 ? goals : '·'}
                </span>
                <span className={`w-8 text-center text-xs font-bold ${isDef && cleanSheetCount > 0 ? 'text-blue-400' : 'text-zinc-700'}`}>
                  {isDef ? cleanSheetCount : '·'}
                </span>
              </div>
            )
          })}
        </div>

        <button
          onClick={resetGame}
          className="w-full bg-transparent border border-zinc-800 text-zinc-500 hover:text-white py-2.5 rounded-lg text-sm transition-colors"
        >
          ↩ New Run
        </button>
      </div>

      <LeagueTable table={leagueTable} />
    </div>
  )
}
