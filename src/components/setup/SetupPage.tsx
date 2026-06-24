import { useGameStore, type DraftMode, type RatingsMode, type RerollCount } from '../../store/gameStore'
import { FORMATION_LIST, FORMATIONS } from '../../data/formations'
import { PitchPreview } from './PitchPreview'

const REROLL_OPTIONS: { value: RerollCount; label: string; tag?: string; desc: string }[] = [
  { value: 0, label: 'None', tag: 'Hard', desc: 'No second chances.' },
  { value: 1, label: 'One', tag: 'Default', desc: 'One re-spin if needed.' },
  { value: 3, label: 'Three', tag: 'Easy', desc: 'Dodge a couple of weak squads.' },
  { value: 5, label: 'Five', tag: 'Easiest', desc: 'Cherry-pick all the way.' },
]

const HOW_TO_PLAY = [
  { title: 'Spin for a Club & Year', desc: 'A random UCL club and season is drawn. Pick whoever you want from their squad.' },
  { title: 'Fill Your Formation', desc: 'Players can fill multiple positions. Out-of-position gives a small rating penalty shown in amber.' },
  { title: 'League Phase', desc: '8 matches. Top 8 → auto R16. 9–24 → Playoff. 25–36 → out.' },
  { title: 'Go Invincible', desc: 'Win the UCL without a single defeat through Playoff → R16 → QF → SF → Final.' },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-zinc-900 last:border-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-red-500 mb-2">{label}</p>
      {children}
    </div>
  )
}

function Tag({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-red-700 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
      {label}
    </span>
  )
}

export function SetupPage() {
  const {
    formation, setFormation,
    showRatings, setShowRatings,
    draftMode, setDraftMode,
    ratingsMode, setRatingsMode,
    rerollCount, setRerollCount,
    startDraft,
  } = useGameStore()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="text-center pt-7 pb-5 px-4 border-b border-zinc-900">
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-4xl font-black tracking-tight mb-0.5">
          <span className="text-red-500">IN</span>VINCIBLES
        </div>
        <div className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase">Champions League Draft</div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-10 divide-y divide-zinc-900">

        {/* Game Mode */}
        <Row label="Game Mode">
          <div className="flex gap-2">
            {([
              { value: 'career' as RatingsMode, label: 'Classic', badge: 'Default', desc: 'Season ratings' },
              { value: 'prime' as RatingsMode, label: 'Prime', badge: 'All-Prime', desc: 'Peak career ratings' },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => setRatingsMode(opt.value)}
                className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all border ${
                  ratingsMode === opt.value ? 'bg-red-950/40 border-red-800' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-base">{opt.value === 'career' ? '🌐' : '⭐'}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">{opt.label}</span>
                    <Tag label={opt.badge} active={ratingsMode === opt.value} />
                  </div>
                  <div className="text-[11px] text-zinc-500">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </Row>

        {/* Re-rolls */}
        <Row label="Re-Rolls">
          <div className="grid grid-cols-4 gap-1.5">
            {REROLL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRerollCount(opt.value)}
                className={`flex flex-col items-center gap-0.5 py-2.5 rounded-lg border transition-all ${
                  rerollCount === opt.value ? 'bg-red-950/40 border-red-800' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-lg font-black text-white">{opt.value}</span>
                <span className="text-[10px] font-medium text-zinc-400">{opt.label}</span>
                {opt.tag && <Tag label={opt.tag} active={rerollCount === opt.value} />}
              </button>
            ))}
          </div>
        </Row>

        {/* Formation */}
        <Row label="Formation">
          <div className="flex gap-3 items-center">
            <div className="w-14 h-20 flex-shrink-0">
              <PitchPreview formation={formation} />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm mb-1">{formation}</p>
              <p className="text-zinc-500 text-xs mb-2">{FORMATIONS[formation]?.description}</p>
              <div className="grid grid-cols-4 gap-1">
                {FORMATION_LIST.map(f => (
                  <button
                    key={f}
                    onClick={() => setFormation(f)}
                    className={`py-1.5 rounded text-[10px] font-bold border transition-all ${
                      formation === f ? 'bg-red-700 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Row>

        {/* Ratings Visibility + Draft Mode — side by side */}
        <Row label="Options">
          <div className="flex gap-2">
            {/* Visibility */}
            <div className="flex-1">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1.5">Ratings</p>
              <div className="flex flex-col gap-1">
                {([
                  { value: true, label: 'Visible', tag: 'Default' },
                  { value: false, label: 'Hidden', tag: 'Hard' },
                ] as const).map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setShowRatings(opt.value)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all ${
                      showRatings === opt.value ? 'bg-red-950/40 border-red-800' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    <Tag label={opt.tag} active={showRatings === opt.value} />
                  </button>
                ))}
              </div>
            </div>
            {/* Draft mode */}
            <div className="flex-1">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1.5">Draft Style</p>
              <div className="flex flex-col gap-1">
                {([
                  { value: 'squad-first' as DraftMode, label: 'Squad First' },
                  { value: 'position-first' as DraftMode, label: 'Position First' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDraftMode(opt.value)}
                    className={`flex items-center px-2.5 py-2 rounded-lg border transition-all ${
                      draftMode === opt.value ? 'bg-red-950/40 border-red-800' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Row>

        {/* How to Play */}
        <Row label="How to Play">
          <div className="flex flex-col gap-2">
            {HOW_TO_PLAY.map((step, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-4 h-4 rounded bg-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-black">{i + 1}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{step.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Row>

        <div className="pt-4">
          <button
            onClick={startDraft}
            className="w-full bg-red-600/90 hover:bg-red-500/90 text-white font-black py-3.5 rounded-xl text-base tracking-widest transition-colors uppercase"
          >
            Draft →
          </button>
        </div>
      </div>
    </div>
  )
}
