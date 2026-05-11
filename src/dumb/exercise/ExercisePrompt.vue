<script setup lang="ts">
import { computed } from 'vue'

import type { LessonExercise } from '@/entities/lesson-data/model'

const props = withDefaults(
  defineProps<{
    exercise: LessonExercise
    revealText?: string
    revealedAnswer?: string
  }>(),
  {
    revealText: undefined,
    revealedAnswer: undefined,
  },
)

const mainParts = computed(() => {
  const [before, ...rest] = props.exercise.main.split('＿')

  return {
    after: rest.join('＿'),
    before,
  }
})
</script>

<template>
  <div class="space-y-5">
    <p
      v-if="exercise.top"
      class="text-sm font-medium uppercase tracking-[0.18em] text-base-content/55"
    >
      {{ exercise.top }}
    </p>

    <p class="text-3xl font-semibold leading-tight tracking-tight text-base-content sm:text-4xl">
      <template v-if="revealedAnswer">
        {{ mainParts.before }}
        <span
          class="pulse-answer rounded-box bg-warning/20 px-2 py-1 text-warning-content shadow-sm"
        >
          {{ revealedAnswer }}
        </span>
        {{ mainParts.after }}
      </template>
      <template v-else>
        {{ exercise.main }}
      </template>
    </p>

    <div
      v-if="exercise.bottom.length > 0"
      class="space-y-1.5 text-sm leading-6 text-base-content/70"
    >
      <p
        v-for="line in exercise.bottom"
        :key="line"
      >
        {{ line }}
      </p>
    </div>

    <div
      v-if="revealText"
      class="space-y-4"
    >
      <hr class="border-base-300">
      <p class="text-lg leading-8 text-base-content/90 sm:text-xl">
        {{ revealText }}
      </p>
    </div>
  </div>
</template>
