import Dexie, { type Table } from 'dexie'

import type { ExerciseProgressRecord } from '@/db/types'

class ClozeDrillDatabase extends Dexie {
  progress!: Table<ExerciseProgressRecord, [string, string, string]>

  constructor() {
    super('cloze-drill')

    this.version(1).stores({
      progress:
        '[language+lesson+main], [language+lesson], language, lesson, dueAt, updatedAt',
    })
  }
}

export const appDb = new ClozeDrillDatabase()
