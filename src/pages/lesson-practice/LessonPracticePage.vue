<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import { toRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppPage from '@/app/AppPage.vue'
import { usePreferredNativeLanguage } from '@/entities/native-language-preference/api'
import PracticeCompleteState from '@/pages/lesson-practice/PracticeCompleteState.vue'
import PracticeExercisePanel from '@/pages/lesson-practice/PracticeExercisePanel.vue'
import { useLessonPractice } from '@/pages/lesson-practice/useLessonPractice'

const props = defineProps<{
  lesson: string
  targetLanguage: string
}>()

const router = useRouter()
const preferredNativeLanguage = usePreferredNativeLanguage()
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
} = useLessonPractice(
  preferredNativeLanguage,
  toRef(props, 'targetLanguage'),
  toRef(props, 'lesson'),
)

watch(
  [preferredNativeLanguage, toRef(props, 'targetLanguage'), toRef(props, 'lesson')],
  () => {
    void load()
  },
  { immediate: true },
)

function goBack(): void {
  void router.push({
    name: 'lesson-select',
    params: {
      targetLanguage: props.targetLanguage,
    },
  })
}
</script>

<template>
  <AppPage
    :back-to="{ name: 'lesson-select', params: { targetLanguage } }"
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
  </AppPage>
</template>
