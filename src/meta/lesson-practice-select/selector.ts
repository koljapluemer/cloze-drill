import type { ExerciseProgressRecord } from '@/db/types'
import {
  isSeenAndDue,
  isSeenAndNotDue,
  makeExerciseRecordKey,
  type HotPoolEntry,
  type PracticeMode,
  type ProgressLookup,
} from '@/entities/exercise-progress/model'
import type { LessonData, LessonExercise } from '@/entities/lesson-data/model'

export interface SelectLessonExerciseInput {
  hotPool: HotPoolEntry[]
  lesson: LessonData
  mode: PracticeMode
  now: Date
  random: () => number
  records: ProgressLookup
}

export type LessonSelectionResult =
  | { kind: 'complete' }
  | { exercise: LessonExercise; kind: 'exercise' }

export function advanceHotPoolAfterShow({
  hotPool,
  lesson,
  now,
  records,
  shownExercise,
}: Omit<SelectLessonExerciseInput, 'mode' | 'random'> & {
  shownExercise: LessonExercise
}): HotPoolEntry[] {
  const nextPool = hotPool
    .map((entry) => ({
      main: entry.main,
      remainingTurns: entry.remainingTurns - 1,
    }))
    .filter(
      (entry) => entry.main !== shownExercise.main && entry.remainingTurns > 0,
    )

  if (
    shownExercise.container.kind !== 'group' ||
    shownExercise.container.ordered
  ) {
    return nextPool
  }

  const { groupId } = shownExercise.container
  const siblings = lesson.exercises.filter(
    (exercise) =>
      exercise.container.kind === 'group' &&
      exercise.container.groupId === groupId &&
      exercise.main !== shownExercise.main,
  )
  const poolByMain = new Map(nextPool.map((entry) => [entry.main, entry]))

  for (const sibling of siblings) {
    const record = getRecord(records, sibling)

    if (!record || isSeenAndNotDue(record, now)) {
      poolByMain.set(sibling.main, {
        main: sibling.main,
        remainingTurns: 4,
      })
    }
  }

  return [...poolByMain.values()]
}

export function selectLessonExercise({
  hotPool,
  lesson,
  mode,
  now,
  random,
  records,
}: SelectLessonExerciseInput): LessonSelectionResult {
  const eligible = lesson.exercises.filter((exercise) =>
    isExerciseUnlocked(lesson, exercise, records, now),
  )

  if (eligible.length === 0) {
    return { kind: 'complete' }
  }

  if (mode === 'infinite') {
    return pickInfiniteExercise(eligible, records, random)
  }

  const dueExercises = eligible.filter((exercise) =>
    isSeenAndDue(getRecord(records, exercise), now),
  )
  const unseenExercises = eligible.filter(
    (exercise) => !getRecord(records, exercise),
  )

  if (dueExercises.length === 0 && unseenExercises.length === 0) {
    return { kind: 'complete' }
  }

  const preferDue = random() < 0.85
  const bucket = preferDue
    ? chooseFallbackBucket(dueExercises, unseenExercises)
    : chooseFallbackBucket(unseenExercises, dueExercises)

  const hotMains = new Set(hotPool.map((entry) => entry.main))
  const hotCandidates = bucket.filter((exercise) => hotMains.has(exercise.main))

  if (hotCandidates.length > 0 && random() < 0.3) {
    return {
      exercise: pickRandomExercise(hotCandidates, random),
      kind: 'exercise',
    }
  }

  return {
    exercise: pickRandomExercise(bucket, random),
    kind: 'exercise',
  }
}

function chooseFallbackBucket(
  preferred: LessonExercise[],
  fallback: LessonExercise[],
): LessonExercise[] {
  return preferred.length > 0 ? preferred : fallback
}

function getDueTimestamp(
  record: ExerciseProgressRecord | undefined,
): number {
  return record?.dueAt ?? 0
}

function getRecord(
  records: ProgressLookup,
  exercise: LessonExercise,
): ExerciseProgressRecord | undefined {
  return records.get(makeExerciseRecordKey(exercise))
}

function isExerciseUnlocked(
  lesson: LessonData,
  exercise: LessonExercise,
  records: ProgressLookup,
  now: Date,
): boolean {
  if (
    exercise.container.kind !== 'group' ||
    !exercise.container.ordered ||
    exercise.container.index === 0
  ) {
    return true
  }

  const { groupId, index } = exercise.container
  const group = lesson.groups.find((entry) => entry.id === groupId)

  if (!group) {
    return true
  }

  return group.exerciseKeys
    .slice(0, index)
    .every((main) => {
      const record = records.get(
        makeExerciseRecordKey({
          lesson: lesson.slug,
          main,
          nativeLanguage: lesson.nativeLanguage,
          targetLanguage: lesson.targetLanguage,
        }),
      )

      return isSeenAndNotDue(record, now)
    })
}

function pickInfiniteExercise(
  exercises: LessonExercise[],
  records: ProgressLookup,
  random: () => number,
): LessonSelectionResult {
  const earliestDue = Math.min(
    ...exercises.map((exercise) => getDueTimestamp(getRecord(records, exercise))),
  )
  const closestExercises = exercises.filter(
    (exercise) => getDueTimestamp(getRecord(records, exercise)) === earliestDue,
  )

  return {
    exercise: pickRandomExercise(closestExercises, random),
    kind: 'exercise',
  }
}

function pickRandomExercise(
  exercises: LessonExercise[],
  random: () => number,
): LessonExercise {
  const index = Math.floor(random() * exercises.length)
  return exercises[index] ?? exercises[0]
}
