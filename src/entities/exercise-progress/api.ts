import { appDb } from '@/db/app-db'
import type { ExerciseProgressRecord } from '@/db/types'

export async function getExerciseProgress(
  language: string,
  lesson: string,
  main: string,
): Promise<ExerciseProgressRecord | undefined> {
  return appDb.progress.get([language, lesson, main])
}

export async function listLessonProgress(
  language: string,
  lesson: string,
): Promise<ExerciseProgressRecord[]> {
  return appDb.progress
    .where('[language+lesson]')
    .equals([language, lesson])
    .toArray()
}

export async function saveExerciseProgress(
  record: ExerciseProgressRecord,
): Promise<void> {
  await appDb.progress.put(record)
}
