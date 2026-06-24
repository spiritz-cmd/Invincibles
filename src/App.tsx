import { useGameStore } from './store/gameStore'
import { SetupPage } from './components/setup/SetupPage'
import { DraftPage } from './components/draft/DraftPage'
import { SquadSummary } from './components/results/SquadSummary'
import { SeasonResults } from './components/results/SeasonResults'

export default function App() {
  const phase = useGameStore(s => s.phase)

  if (phase === 'setup') return <SetupPage />
  if (phase === 'draft') return <DraftPage />
  if (phase === 'squad') return <SquadSummary />
  if (phase === 'results') return <SeasonResults />

  return <SetupPage />
}
