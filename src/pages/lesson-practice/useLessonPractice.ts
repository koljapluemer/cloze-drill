import { computed, type Ref, ref } from 'vue'

import type { ExerciseProgressRecord } from '@/db/types'
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
import {
  createExerciseProgress,
  reviewExercise,
} from '@/features/exercise-review/reviewExercise'
import {
  loadSessionHotPool,
  saveSessionHotPool,
} from '@/features/session-practice-hot-pool/storage'
import {
  advanceHotPoolAfterShow,
  selectLessonExercise,
} from '@/meta/lesson-practice-select/selector'

export function useLessonPractice(
  nativeLanguage: Readonly<Ref<string | null>>,
  targetLanguage: Readonly<Ref<string>>,
  lesson: Readonly<Ref<string>>,
) {
  const currentExercise = ref<LessonExercise | null>(null)
  const currentExerciseIsNew = computed(() =>
    currentExercise.value
      ? !records.value.get(makeExerciseRecordKey(currentExercise.value))
      : false,
  )
  const errorMessage = ref('')
  const exerciseVersion = ref(0)
  const isLoading = ref(true)
  const isSaving = ref(false)
  const lessonData = ref<LessonData | null>(null)
  const mode = ref<PracticeMode>('normal')
  const records = ref<ProgressLookup>(new Map())
  const sessionHotPool = ref<ReturnType<typeof loadSessionHotPool>>([])

  const complete = computed(
    () =>
      !isLoading.value &&
      !errorMessage.value &&
      !currentExercise.value &&
      !isSaving.value,
  )

  async function load(): Promise<void> {
    const activeNativeLanguage = nativeLanguage.value

    if (!activeNativeLanguage) {
      currentExercise.value = null
      errorMessage.value = 'Could not load this lesson.'
      isLoading.value = false
      lessonData.value = null
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      const [loadedLesson, progress] = await Promise.all([
        loadLesson(activeNativeLanguage, targetLanguage.value, lesson.value),
        listLessonProgress(activeNativeLanguage, targetLanguage.value, lesson.value),
      ])

      lessonData.value = loadedLesson
      records.value = buildProgressLookup(progress)
      sessionHotPool.value = loadSessionHotPool(
        activeNativeLanguage,
        targetLanguage.value,
        lesson.value,
      )
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
      await wait(500)
      finalizeRecord(nextRecord)
      pickNextExercise()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not save this review.'
    } finally {
      isSaving.value = false
    }
  }

  async function rememberExercise(): Promise<void> {
    if (
      !lessonData.value ||
      !currentExercise.value ||
      !currentExerciseIsNew.value ||
      isSaving.value
    ) {
      return
    }

    isSaving.value = true

    try {
      const nextRecord = await createExerciseProgress({
        exercise: currentExercise.value,
      })
      await wait(500)
      finalizeRecord(nextRecord)
      pickNextExercise()
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not create this flashcard.'
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
    const activeNativeLanguage = nativeLanguage.value

    if (!activeNativeLanguage) {
      return
    }

    sessionHotPool.value = advanceHotPoolAfterShow({
      hotPool: sessionHotPool.value,
      lesson: lessonData.value,
      now: new Date(),
      records: records.value,
      shownExercise: selection.exercise,
    })
    saveSessionHotPool(
      activeNativeLanguage,
      targetLanguage.value,
      lesson.value,
      sessionHotPool.value,
    )
    exerciseVersion.value += 1
  }

  function finalizeRecord(record: ExerciseProgressRecord): void {
    const nextLookup = new Map(records.value)

    nextLookup.set(makeExerciseRecordKey(record), record)
    records.value = nextLookup
  }

  return {
    complete,
    currentExercise,
    currentExerciseIsNew,
    errorMessage,
    exerciseVersion,
    isLoading,
    isSaving,
    lessonData,
    load,
    mode,
    rememberExercise,
    startInfinitePractice,
    submitOutcome,
  }
}

async function wait(durationMs: number): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}
