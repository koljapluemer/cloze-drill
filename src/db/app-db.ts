import Dexie, { type Table } from 'dexie'

import type { ExerciseProgressRecord } from '@/db/types'

class ClozeDrillDatabase extends Dexie {
  progress!: Table<ExerciseProgressRecord, [string, string, string, string]>

  constructor() {
    super('cloze-drill')

    this.version(1).stores({
      progress:
        '[language+lesson+main], [language+lesson], language, lesson, dueAt, updatedAt',
    })

    this.version(2).stores({
      progress:
        '[nativeLanguage+targetLanguage+lesson+main], [nativeLanguage+targetLanguage+lesson], nativeLanguage, targetLanguage, lesson, dueAt, updatedAt',
    })
  }
}

export const appDb = new ClozeDrillDatabase()
