<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

import PageFrame from '@/dumb/layout/PageFrame.vue'
import PracticeCompleteState from '@/pages/lesson-practice/PracticeCompleteState.vue'
import PracticeExercisePanel from '@/pages/lesson-practice/PracticeExercisePanel.vue'
import { useLessonPractice } from '@/pages/lesson-practice/useLessonPractice'

const props = defineProps<{
  language: string
  lesson: string
}>()

const router = useRouter()
const {
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
} = useLessonPractice(props.language, props.lesson)

onMounted(load)

function goBack(): void {
  void router.push({
    name: 'lesson-select',
    params: {
      language: props.language,
    },
  })
}
</script>

<template>
  <PageFrame
    :back-to="{ name: 'lesson-select', params: { language } }"
    :subtitle="lessonData?.description ?? 'Practice one cloze at a time.'"
    :title="lessonData?.name ?? 'Practice'"
  >
    <template #header-actions>
      <div
        v-if="mode === 'infinite'"
        class="inline-flex items-center gap-2 rounded-full bg-warning/15 px-4 py-2 text-sm font-medium text-warning-content"
      >
        <Sparkles class="size-4" />
        Infinite practice
      </div>
    </template>

    <Transition
      name="route-fade"
      appear
      mode="out-in"
    >
      <div
        v-if="isLoading"
        key="loading"
        class="skeleton h-[22rem] rounded-box"
      />

      <div
        v-else-if="errorMessage"
        key="error"
        class="alert border border-error/20 bg-error/10 text-error"
      >
        {{ errorMessage }}
      </div>

      <PracticeCompleteState
        v-else-if="complete"
        key="complete"
        @back="goBack"
        @infinite="startInfinitePractice"
      />

      <PracticeExercisePanel
        v-else-if="currentExercise"
        :key="`${currentExercise.main}:${exerciseVersion}`"
        :busy="isSaving"
        :exercise="currentExercise"
        :is-new-exercise="currentExerciseIsNew"
        @answered="submitOutcome"
        @remembered="rememberExercise"
      />
    </Transition>
  </PageFrame>
</template>
