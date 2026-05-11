import type { ExerciseProgressRecord } from '@/db/types'

export interface ExerciseIdentity {
  language: string
  lesson: string
  main: string
}

export interface HotPoolEntry {
  main: string
  remainingTurns: number
}

export type PracticeMode = 'normal' | 'infinite'
export type ProgressLookup = Map<string, ExerciseProgressRecord>
export type ReviewOutcome = 'wrong' | 'correct'

export function buildProgressLookup(
  records: ExerciseProgressRecord[],
): ProgressLookup {
  return new Map(
    records.map((record) => [makeExerciseRecordKey(record), record]),
  )
}

export function isSeenRecord(record: ExerciseProgressRecord | undefined): boolean {
  return Boolean(record)
}

export function isSeenAndDue(
  record: ExerciseProgressRecord | undefined,
  now: Date,
): boolean {
  if (!record) {
    return false
  }

  return record.dueAt <= now.getTime()
}

export function isSeenAndNotDue(
  record: ExerciseProgressRecord | undefined,
  now: Date,
): boolean {
  if (!record) {
    return false
  }

  return record.dueAt > now.getTime()
}

export function makeExerciseRecordKey(identity: ExerciseIdentity): string {
  return `${identity.language}::${identity.lesson}::${identity.main}`
}
