import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FORMATIONS, type Formation } from '../data/formations'
import type { Player } from '../data/players'

export type Difficulty = 'easy' | 'normal' | 'hard'
export type DraftMode = 'squad-first' | 'position-first'
export type RatingsMode = 'career' | 'prime'
export type RerollCount = 0 | 1 | 3 | 5

export type DraftedPlayer = {
  player: Player
  club: string
  season: string
  rating: number
  slotId: string | null
}

export type MatchResult = {
  opponent: string
  opponentStrength: number
  goalsFor: number
  goalsAgainst: number
  scorers: string[]
  stage: string
  leg?: 1 | 2
}

export type TeamStanding = {
  name: string
  strength: number
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
  isUser: boolean
}

export type SimulationResult = {
  leaguePhaseResults: MatchResult[]
  leaguePhasePosition: number
  leaguePhasePoints: number
  leaguePhaseGF: number
  leaguePhaseGA: number
  advancedAs: 'direct' | 'playoff' | 'eliminated'
  knockoutResults: MatchResult[]
  finalPosition: string
  won: boolean
  leagueTable: TeamStanding[]
}

type GameState = {
  // Setup
  phase: 'setup' | 'draft' | 'squad' | 'simulate' | 'results'
  formation: string
  difficulty: Difficulty
  rerollCount: RerollCount
  showRatings: boolean
  draftMode: DraftMode
  ratingsMode: RatingsMode

  // Draft state
  draftedPlayers: DraftedPlayer[]
  currentSpinClub: string | null
  currentSpinSeason: string | null
  activeSlotId: string | null // for position-first

  // Results
  simulationResult: SimulationResult | null
  overallRating: number

  // Actions
  setFormation: (f: string) => void
  setDifficulty: (d: Difficulty) => void
  setRerollCount: (n: RerollCount) => void
  setShowRatings: (v: boolean) => void
  setDraftMode: (m: DraftMode) => void
  setRatingsMode: (m: RatingsMode) => void
  startDraft: () => void
  setSpin: (club: string, season: string) => void
  addPlayer: (drafted: DraftedPlayer) => void
  assignSlot: (playerId: string, slotId: string) => void
  setActiveSlot: (slotId: string | null) => void
  setSimulationResult: (result: SimulationResult, overall: number) => void
  goToPhase: (phase: GameState['phase']) => void
  resetGame: () => void
}

const defaultState = {
  phase: 'setup' as const,
  formation: '4-3-3',
  difficulty: 'easy' as Difficulty,
  rerollCount: 1 as RerollCount,
  showRatings: true,
  draftMode: 'squad-first' as DraftMode,
  ratingsMode: 'career' as RatingsMode,
  draftedPlayers: [],
  currentSpinClub: null,
  currentSpinSeason: null,
  activeSlotId: null,
  simulationResult: null,
  overallRating: 0,
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...defaultState,

      setFormation: (f) => set({ formation: f }),
      setDifficulty: (d) => set({ difficulty: d }),
      setRerollCount: (n) => set({ rerollCount: n }),
      setShowRatings: (v) => set({ showRatings: v }),
      setDraftMode: (m) => set({ draftMode: m }),
      setRatingsMode: (m) => set({ ratingsMode: m }),

      startDraft: () => set({ phase: 'draft', draftedPlayers: [] }),

      setSpin: (club, season) => set({ currentSpinClub: club, currentSpinSeason: season }),

      addPlayer: (drafted) =>
        set((state) => ({
          draftedPlayers: [...state.draftedPlayers, drafted],
          currentSpinClub: null,
          currentSpinSeason: null,
        })),

      assignSlot: (playerId, slotId) =>
        set((state) => ({
          draftedPlayers: state.draftedPlayers.map((dp) =>
            dp.player.id === playerId ? { ...dp, slotId } : dp
          ),
        })),

      setActiveSlot: (slotId) => set({ activeSlotId: slotId }),

      setSimulationResult: (result, overall) =>
        set({ simulationResult: result, overallRating: overall, phase: 'results' }),

      goToPhase: (phase) => set({ phase }),

      resetGame: () => set((state) => ({
        ...defaultState,
        formation: state.formation,
        rerollCount: state.rerollCount,
        showRatings: state.showRatings,
        draftMode: state.draftMode,
        ratingsMode: state.ratingsMode,
      })),
    }),
    {
      name: 'invincibles-settings',
      partialize: (state) => ({
        formation: state.formation,
        rerollCount: state.rerollCount,
        showRatings: state.showRatings,
        draftMode: state.draftMode,
        ratingsMode: state.ratingsMode,
      }),
    }
  )
)

export function getFormation(name: string): Formation {
  return FORMATIONS[name] ?? FORMATIONS['4-3-3']
}
