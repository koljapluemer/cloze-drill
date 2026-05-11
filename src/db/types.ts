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
  language: string
  lastOutcome: 'wrong' | 'correct'
  lesson: string
  main: string
  updatedAt: number
}
