import { describe, expect, it } from 'vitest'

import type { ExerciseProgressRecord } from '@/db/types'
import {
  buildProgressLookup,
  type HotPoolEntry,
} from '@/entities/exercise-progress/model'
import type { LessonData, LessonExercise } from '@/entities/lesson-data/model'
import {
  advanceHotPoolAfterShow,
  selectLessonExercise,
} from '@/meta/lesson-practice-select/selector'

function createLesson(
  exercises: LessonExercise[],
  groups: LessonData['groups'] = [],
): LessonData {
  return {
    exercises,
    groups,
    name: 'Test lesson',
    nativeLanguage: 'eng',
    slug: 'test-lesson',
    targetLanguage: 'vie',
  }
}

function createRecord(main: string, dueAt: number): ExerciseProgressRecord {
  return {
    card: {
      difficulty: 4,
      due: dueAt,
      elapsed_days: 0,
      lapses: 0,
      last_review: dueAt - 1_000,
      learning_steps: 0,
      reps: 1,
      scheduled_days: 1,
      stability: 1,
      state: 2,
    },
    dueAt,
    lastOutcome: 'correct',
    lesson: 'test-lesson',
    main,
    nativeLanguage: 'eng',
    targetLanguage: 'vie',
    updatedAt: dueAt - 1_000,
  }
}

const now = new Date('2026-05-11T10:00:00.000Z')

describe('selectLessonExercise', () => {
  it('prefers due cards and falls back to unseen', () => {
    const lesson = createLesson([
      {
        answers: ['đúng', 'sai'],
        bottom: [],
        container: { kind: 'flat' },
        kind: 'choice',
        lesson: 'test-lesson',
        main: 'due exercise',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
      {
        answers: ['mới', 'cũ'],
        bottom: [],
        container: { kind: 'flat' },
        kind: 'choice',
        lesson: 'test-lesson',
        main: 'new exercise',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
    ])
    const records = buildProgressLookup([
      createRecord('due exercise', now.getTime() - 60_000),
    ])

    const pickedDue = selectLessonExercise({
      hotPool: [],
      lesson,
      mode: 'normal',
      now,
      random: () => 0.1,
      records,
    })

    expect(pickedDue).toMatchObject({
      exercise: { main: 'due exercise' },
      kind: 'exercise',
    })

    const pickedFallback = selectLessonExercise({
      hotPool: [],
      lesson,
      mode: 'normal',
      now,
      random: () => 0.99,
      records: buildProgressLookup([]),
    })

    expect(pickedFallback).toMatchObject({
      exercise: { main: 'new exercise' },
      kind: 'exercise',
    })
  })

  it('locks ordered groups until previous cards are seen and not due', () => {
    const lesson = createLesson(
      [
        {
          answer: 'một',
          bottom: [],
          container: { groupId: 'g1', index: 0, kind: 'group', ordered: true },
          kind: 'answer',
          lesson: 'test-lesson',
          main: 'first',
          nativeLanguage: 'eng',
          targetLanguage: 'vie',
        },
        {
          answer: 'hai',
          bottom: [],
          container: { groupId: 'g1', index: 1, kind: 'group', ordered: true },
          kind: 'answer',
          lesson: 'test-lesson',
          main: 'second',
          nativeLanguage: 'eng',
          targetLanguage: 'vie',
        },
      ],
      [{ exerciseKeys: ['first', 'second'], id: 'g1', ordered: true }],
    )

    const locked = selectLessonExercise({
      hotPool: [],
      lesson,
      mode: 'normal',
      now,
      random: () => 0.5,
      records: buildProgressLookup([]),
    })

    expect(locked).toMatchObject({
      exercise: { main: 'first' },
      kind: 'exercise',
    })

    const unlocked = selectLessonExercise({
      hotPool: [],
      lesson,
      mode: 'normal',
      now,
      random: () => 0.5,
      records: buildProgressLookup([createRecord('first', now.getTime() + 60_000)]),
    })

    expect(unlocked.kind).toBe('exercise')
    if (unlocked.kind !== 'exercise') {
      throw new Error('Expected an exercise selection')
    }

    expect(['first', 'second']).toContain(unlocked.exercise.main)
  })

  it('prefers hot-pool cards inside the chosen bucket', () => {
    const lesson = createLesson([
      {
        answer: 'một',
        bottom: [],
        container: { groupId: 'g1', index: 0, kind: 'group', ordered: false },
        kind: 'answer',
        lesson: 'test-lesson',
        main: 'hot exercise',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
      {
        answer: 'hai',
        bottom: [],
        container: { groupId: 'g1', index: 1, kind: 'group', ordered: false },
        kind: 'answer',
        lesson: 'test-lesson',
        main: 'cold exercise',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
    ])
    const records = buildProgressLookup([
      createRecord('hot exercise', now.getTime() - 60_000),
      createRecord('cold exercise', now.getTime() - 60_000),
    ])
    const hotPool: HotPoolEntry[] = [{ main: 'hot exercise', remainingTurns: 2 }]
    const rolls = [0.2, 0.1, 0]

    const selection = selectLessonExercise({
      hotPool,
      lesson,
      mode: 'normal',
      now,
      random: () => rolls.shift() ?? 0,
      records,
    })

    expect(selection).toMatchObject({
      exercise: { main: 'hot exercise' },
      kind: 'exercise',
    })
  })

  it('expires hot-pool items after four shown exercises and removes shown items', () => {
    const lesson = createLesson(
      [
        {
          answer: 'một',
          bottom: [],
          container: { groupId: 'g1', index: 0, kind: 'group', ordered: false },
          kind: 'answer',
          lesson: 'test-lesson',
          main: 'first',
          nativeLanguage: 'eng',
          targetLanguage: 'vie',
        },
        {
          answer: 'hai',
          bottom: [],
          container: { groupId: 'g1', index: 1, kind: 'group', ordered: false },
          kind: 'answer',
          lesson: 'test-lesson',
          main: 'second',
          nativeLanguage: 'eng',
          targetLanguage: 'vie',
        },
        {
          answer: 'ba',
          bottom: [],
          container: { groupId: 'g1', index: 2, kind: 'group', ordered: false },
          kind: 'answer',
          lesson: 'test-lesson',
          main: 'third',
          nativeLanguage: 'eng',
          targetLanguage: 'vie',
        },
      ],
      [{ exerciseKeys: ['first', 'second', 'third'], id: 'g1', ordered: false }],
    )
    const records = buildProgressLookup([
      createRecord('first', now.getTime() + 60_000),
      createRecord('second', now.getTime() + 60_000),
      createRecord('third', now.getTime() + 60_000),
    ])

    const hotPool = advanceHotPoolAfterShow({
      hotPool: [],
      lesson,
      now,
      records,
      shownExercise: lesson.exercises[0],
    })

    expect(hotPool).toEqual([
      { main: 'second', remainingTurns: 4 },
      { main: 'third', remainingTurns: 4 },
    ])

    const afterShownHot = advanceHotPoolAfterShow({
      hotPool,
      lesson,
      now,
      records,
      shownExercise: lesson.exercises[1],
    })

    expect(afterShownHot.some((entry) => entry.main === 'second')).toBe(false)
  })

  it('returns complete in normal mode and falls back to earliest due in infinite mode', () => {
    const lesson = createLesson([
      {
        answer: 'một',
        bottom: [],
        container: { kind: 'flat' },
        kind: 'answer',
        lesson: 'test-lesson',
        main: 'future one',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
      {
        answer: 'hai',
        bottom: [],
        container: { kind: 'flat' },
        kind: 'answer',
        lesson: 'test-lesson',
        main: 'future two',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
    ])
    const records = buildProgressLookup([
      createRecord('future one', now.getTime() + 600_000),
      createRecord('future two', now.getTime() + 60_000),
    ])

    const complete = selectLessonExercise({
      hotPool: [],
      lesson,
      mode: 'normal',
      now,
      random: () => 0.1,
      records,
    })

    expect(complete).toEqual({ kind: 'complete' })

    const infinite = selectLessonExercise({
      hotPool: [],
      lesson,
      mode: 'infinite',
      now,
      random: () => 0.1,
      records,
    })

    expect(infinite).toMatchObject({
      exercise: { main: 'future two' },
      kind: 'exercise',
    })
  })
})
