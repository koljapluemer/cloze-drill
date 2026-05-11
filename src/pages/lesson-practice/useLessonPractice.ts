import { computed, ref } from 'vue'

import { listLessonProgress } from '@/entities/exercise-progress/api'
import {
  buildProgressLookup,
  makeExerciseRecordKey,
  type PracticeMode,
  type ProgressLookup,
  type ReviewOutcome,
} from '@/entities/exercise-progress/model'
import { loadLesson } from '@/entities/lesson-data/api'
import type { LessonData, LessonExercise } from '@/entities/lesson-data/model'
import { reviewExercise } from '@/features/exercise-review/reviewExercise'
import {
  loadSessionHotPool,
  saveSessionHotPool,
} from '@/features/session-practice-hot-pool/storage'
import {
  advanceHotPoolAfterShow,
  selectLessonExercise,
} from '@/meta/lesson-practice-select/selector'

export function useLessonPractice(language: string, lesson: string) {
  const currentExercise = ref<LessonExercise | null>(null)
  const errorMessage = ref('')
  const exerciseVersion = ref(0)
  const isLoading = ref(true)
  const isSaving = ref(false)
  const lessonData = ref<LessonData | null>(null)
  const mode = ref<PracticeMode>('normal')
  const records = ref<ProgressLookup>(new Map())
  const sessionHotPool = ref(loadSessionHotPool(language, lesson))

  const complete = computed(
    () =>
      !isLoading.value &&
      !errorMessage.value &&
      !currentExercise.value &&
      !isSaving.value,
  )

  async function load(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const [loadedLesson, progress] = await Promise.all([
        loadLesson(language, lesson),
        listLessonProgress(language, lesson),
      ])

      lessonData.value = loadedLesson
      records.value = buildProgressLookup(progress)
      sessionHotPool.value = loadSessionHotPool(language, lesson)
      pickNextExercise()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load this lesson.'
    } finally {
      isLoading.value = false
    }
  }

  async function submitOutcome(outcome: ReviewOutcome): Promise<void> {
    if (!lessonData.value || !currentExercise.value || isSaving.value) {
      return
    }

    isSaving.value = true

    try {
      const reviewedExercise = currentExercise.value
      const nextRecord = await reviewExercise({
        existingRecord: records.value.get(makeExerciseRecordKey(reviewedExercise)),
        exercise: reviewedExercise,
        outcome,
      })
      const nextLookup = new Map(records.value)

      nextLookup.set(makeExerciseRecordKey(nextRecord), nextRecord)
      records.value = nextLookup

      await wait(500)
      pickNextExercise()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not save this review.'
    } finally {
      isSaving.value = false
    }
  }

  function startInfinitePractice(): void {
    mode.value = 'infinite'
    pickNextExercise()
  }

  function pickNextExercise(): void {
    if (!lessonData.value) {
      currentExercise.value = null
      return
    }

    const selection = selectLessonExercise({
      hotPool: sessionHotPool.value,
      lesson: lessonData.value,
      mode: mode.value,
      now: new Date(),
      random: Math.random,
      records: records.value,
    })

    if (selection.kind === 'complete') {
      currentExercise.value = null
      return
    }

    currentExercise.value = selection.exercise
    sessionHotPool.value = advanceHotPoolAfterShow({
      hotPool: sessionHotPool.value,
      lesson: lessonData.value,
      now: new Date(),
      records: records.value,
      shownExercise: selection.exercise,
    })
    saveSessionHotPool(language, lesson, sessionHotPool.value)
    exerciseVersion.value += 1
  }

  return {
    complete,
    currentExercise,
    errorMessage,
    exerciseVersion,
    isLoading,
    isSaving,
    lessonData,
    load,
    mode,
    startInfinitePractice,
    submitOutcome,
  }
}

async function wait(durationMs: number): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}
