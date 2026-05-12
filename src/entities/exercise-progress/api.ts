import { appDb } from '@/db/app-db'
import type { ExerciseProgressRecord } from '@/db/types'

export async function getExerciseProgress(
  nativeLanguage: string,
  targetLanguage: string,
  lesson: string,
  main: string,
): Promise<ExerciseProgressRecord | undefined> {
  return appDb.progress.get([nativeLanguage, targetLanguage, lesson, main])
}

export async function listLessonProgress(
  nativeLanguage: string,
  targetLanguage: string,
  lesson: string,
): Promise<ExerciseProgressRecord[]> {
  return appDb.progress
    .where('[nativeLanguage+targetLanguage+lesson]')
    .equals([nativeLanguage, targetLanguage, lesson])
    .toArray()
}

export async function saveExerciseProgress(
  record: ExerciseProgressRecord,
): Promise<void> {
  await appDb.progress.put(record)
}
