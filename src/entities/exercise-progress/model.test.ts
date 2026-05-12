import { describe, expect, it } from 'vitest'

import { makeExerciseRecordKey } from '@/entities/exercise-progress/model'

describe('makeExerciseRecordKey', () => {
  it('includes native language in the exercise identity', () => {
    const englishKey = makeExerciseRecordKey({
      lesson: 'usage-als-wie',
      main: 'Besser ＿ nichts.',
      nativeLanguage: 'eng',
      targetLanguage: 'deu',
    })
    const arabicKey = makeExerciseRecordKey({
      lesson: 'usage-als-wie',
      main: 'Besser ＿ nichts.',
      nativeLanguage: 'arb',
      targetLanguage: 'deu',
    })

    expect(englishKey).not.toBe(arabicKey)
  })
})
