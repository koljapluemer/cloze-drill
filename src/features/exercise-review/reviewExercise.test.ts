import { describe, expect, it, vi } from 'vitest'

import { saveExerciseProgress } from '@/entities/exercise-progress/api'
import { createExerciseProgress } from '@/features/exercise-review/reviewExercise'

vi.mock('@/entities/exercise-progress/api', () => ({
  saveExerciseProgress: vi.fn(),
}))

describe('createExerciseProgress', () => {
  it('creates and stores an unseen exercise record without applying a review rating', async () => {
    const now = new Date('2026-05-11T10:00:00.000Z')
    const record = await createExerciseProgress({
      exercise: {
        lesson: 'fun-idioms',
        main: 'giận cá chém ＿',
        nativeLanguage: 'eng',
        targetLanguage: 'vie',
      },
      now,
    })

    expect(record.nativeLanguage).toBe('eng')
    expect(record.targetLanguage).toBe('vie')
    expect(record.lesson).toBe('fun-idioms')
    expect(record.main).toBe('giận cá chém ＿')
    expect(record.lastOutcome).toBe('created')
    expect(record.updatedAt).toBe(now.getTime())
    expect(record.dueAt).toBe(record.card.due)
    expect(record.card.last_review).toBeNull()
    expect(saveExerciseProgress).toHaveBeenCalledWith(record)
  })
})
