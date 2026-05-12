import type { State } from 'ts-fsrs'

export interface SerializedCardState {
  due: number
  difficulty: number
  elapsed_days: number
  lapses: number
  last_review: number | null
  learning_steps: number
  reps: number
  scheduled_days: number
  stability: number
  state: State
}

export interface ExerciseProgressRecord {
  card: SerializedCardState
  dueAt: number
  lastOutcome: 'wrong' | 'correct' | 'created'
  lesson: string
  main: string
  nativeLanguage: string
  targetLanguage: string
  updatedAt: number
}
