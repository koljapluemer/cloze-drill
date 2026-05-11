<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import ExercisePrompt from '@/dumb/exercise/ExercisePrompt.vue'
import type {
  ChoiceExercise,
  LessonExercise,
} from '@/entities/lesson-data/model'
import type { ReviewOutcome } from '@/entities/exercise-progress/model'

const props = withDefaults(
  defineProps<{
    busy?: boolean
    exercise: LessonExercise
  }>(),
  {
    busy: false,
  },
)

const emit = defineEmits<{
  answered: [ReviewOutcome]
}>()

const disabledChoices = ref<string[]>([])
const hasRevealed = ref(false)
const lastOutcome = ref<ReviewOutcome | null>(null)
const shuffledChoices = ref<string[]>([])
const wrongAttempted = ref(false)

const revealedAnswer = computed(() => {
  if (props.exercise.kind === 'choice' && lastOutcome.value) {
    return props.exercise.answers[0]
  }

  if (props.exercise.kind === 'answer' && hasRevealed.value) {
    return props.exercise.answer
  }

  return undefined
})

const revealText = computed(() => {
  if (props.exercise.kind === 'reveal' && hasRevealed.value) {
    return props.exercise.reveal
  }

  return undefined
})

const showAnswerButtons = computed(
  () =>
    hasRevealed.value &&
    lastOutcome.value === null &&
    (props.exercise.kind === 'answer' || props.exercise.kind === 'reveal'),
)

const showChoiceButtons = computed(
  () => props.exercise.kind === 'choice' && lastOutcome.value === null,
)

watch(
  () => props.exercise,
  (exercise) => {
    disabledChoices.value = []
    hasRevealed.value = false
    lastOutcome.value = null
    wrongAttempted.value = false
    shuffledChoices.value =
      exercise.kind === 'choice'
        ? shuffleChoices(exercise)
        : []
  },
  { immediate: true },
)

function chooseAnswer(answer: string): void {
  if (props.exercise.kind !== 'choice' || lastOutcome.value || props.busy) {
    return
  }

  const correctAnswer = props.exercise.answers[0]

  if (answer !== correctAnswer) {
    if (!disabledChoices.value.includes(answer)) {
      disabledChoices.value = [...disabledChoices.value, answer]
    }

    wrongAttempted.value = true
    return
  }

  const outcome: ReviewOutcome = wrongAttempted.value ? 'wrong' : 'correct'

  lastOutcome.value = outcome
  emit('answered', outcome)
}

function reveal(): void {
  if (props.busy) {
    return
  }

  hasRevealed.value = true
}

function score(outcome: ReviewOutcome): void {
  if (lastOutcome.value || props.busy) {
    return
  }

  lastOutcome.value = outcome
  emit('answered', outcome)
}

function shuffleChoices(exercise: ChoiceExercise): string[] {
  const nextChoices = [...exercise.answers]

  for (let index = nextChoices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = nextChoices[index]

    nextChoices[index] = nextChoices[swapIndex] ?? current
    nextChoices[swapIndex] = current
  }

  return nextChoices
}
</script>

<template>
  <section class="card border border-base-300/70 bg-base-100 shadow-sm">
    <div class="card-body gap-8 sm:p-8">
      <ExercisePrompt
        :exercise="exercise"
        :reveal-text="revealText"
        :revealed-answer="revealedAnswer"
      />

      <Transition
        name="swap-rise"
        mode="out-in"
      >
        <div
          v-if="showChoiceButtons"
          key="choice-buttons"
          class="grid gap-3 sm:grid-cols-2"
        >
          <button
            v-for="answer in shuffledChoices"
            :key="answer"
            :class="[
              'btn btn-lg h-auto min-h-16 justify-start whitespace-normal px-5 py-4 text-left text-base font-medium',
              disabledChoices.includes(answer) ? 'btn-disabled opacity-45' : 'btn-outline',
            ]"
            :disabled="busy || disabledChoices.includes(answer)"
            type="button"
            @click="chooseAnswer(answer)"
          >
            {{ answer }}
          </button>
        </div>

        <div
          v-else-if="showAnswerButtons"
          key="score-buttons"
          class="flex flex-wrap gap-3"
        >
          <button
            class="btn btn-outline"
            :disabled="busy"
            type="button"
            @click="score('wrong')"
          >
            Wrong
          </button>
          <button
            class="btn btn-neutral"
            :disabled="busy"
            type="button"
            @click="score('correct')"
          >
            Correct
          </button>
        </div>

        <div
          v-else-if="!hasRevealed"
          key="reveal-button"
          class="flex"
        >
          <button
            class="btn btn-neutral"
            :disabled="busy"
            type="button"
            @click="reveal"
          >
            Reveal
          </button>
        </div>

        <div
          v-else
          key="settled"
          class="h-0"
        />
      </Transition>
    </div>
  </section>
</template>
