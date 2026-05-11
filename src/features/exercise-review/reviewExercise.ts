import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'

import type { ExerciseIdentity, ReviewOutcome } from '@/entities/exercise-progress/model'
import { saveExerciseProgress } from '@/entities/exercise-progress/api'
import type { ExerciseProgressRecord, SerializedCardState } from '@/db/types'

const scheduler = fsrs()

interface ReviewExerciseInput {
  existingRecord?: ExerciseProgressRecord
  exercise: ExerciseIdentity
  now?: Date
  outcome: ReviewOutcome
}

export async function reviewExercise({
  existingRecord,
  exercise,
  now = new Date(),
  outcome,
}: ReviewExerciseInput): Promise<ExerciseProgressRecord> {
  const card = existingRecord
    ? deserializeCard(existingRecord.card)
    : createEmptyCard(now)
  const rating = outcome === 'correct' ? Rating.Good : Rating.Again
  const result = scheduler.next(card, now, rating)

  const record: ExerciseProgressRecord = {
    card: serializeCard(result.card),
    dueAt: result.card.due.getTime(),
    language: exercise.language,
    lastOutcome: outcome,
    lesson: exercise.lesson,
    main: exercise.main,
    updatedAt: now.getTime(),
  }

  await saveExerciseProgress(record)

  return record
}

function deserializeCard(card: SerializedCardState): Card {
  return {
    difficulty: card.difficulty,
    due: new Date(card.due),
    elapsed_days: card.elapsed_days,
    lapses: card.lapses,
    last_review:
      typeof card.last_review === 'number' ? new Date(card.last_review) : undefined,
    learning_steps: card.learning_steps,
    reps: card.reps,
    scheduled_days: card.scheduled_days,
    stability: card.stability,
    state: card.state,
  }
}

function serializeCard(card: Card): SerializedCardState {
  return {
    difficulty: card.difficulty,
    due: card.due.getTime(),
    elapsed_days: card.elapsed_days,
    lapses: card.lapses,
    last_review: card.last_review?.getTime() ?? null,
    learning_steps: card.learning_steps,
    reps: card.reps,
    scheduled_days: card.scheduled_days,
    stability: card.stability,
    state: card.state,
  }
}
