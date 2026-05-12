<script setup lang="ts">
import { BookOpen, Play } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppPage from '@/app/AppPage.vue'
import { clearSessionHotPool } from '@/features/session-practice-hot-pool/storage'
import {
  loadLessonIndex,
  loadTargetLanguageIndex,
} from '@/entities/lesson-data/api'
import type {
  LanguageCatalogEntry,
  LessonCatalogEntry,
} from '@/entities/lesson-data/model'
import { usePreferredNativeLanguage } from '@/entities/native-language-preference/api'

const props = defineProps<{
  targetLanguage: string
}>()

const router = useRouter()

const errorMessage = ref('')
const isLoading = ref(true)
const languageCatalog = ref<LanguageCatalogEntry[]>([])
const lessons = ref<LessonCatalogEntry[]>([])
const preferredNativeLanguage = usePreferredNativeLanguage()

const languageName = computed(() => {
  const match = languageCatalog.value.find(
    (entry) => entry.code === props.targetLanguage,
  )
  return match?.name ?? props.targetLanguage.toUpperCase()
})

async function loadPage(): Promise<void> {
  const nativeLanguage = preferredNativeLanguage.value

  if (!nativeLanguage) {
    lessons.value = []
    languageCatalog.value = []
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [loadedLanguages, loadedLessons] = await Promise.all([
      loadTargetLanguageIndex(nativeLanguage),
      loadLessonIndex(nativeLanguage, props.targetLanguage),
    ])

    languageCatalog.value = loadedLanguages
    lessons.value = loadedLessons
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load lessons.'
  } finally {
    isLoading.value = false
  }
}

async function startLesson(slug: string): Promise<void> {
  const nativeLanguage = preferredNativeLanguage.value

  if (!nativeLanguage) {
    return
  }

  clearSessionHotPool(nativeLanguage, props.targetLanguage, slug)
  await router.push({
    name: 'lesson-practice',
    params: {
      targetLanguage: props.targetLanguage,
      lesson: slug,
    },
  })
}

watch(
  [() => props.targetLanguage, preferredNativeLanguage],
  () => {
    void loadPage()
  },
  { immediate: true },
)
</script>

<template>
  <AppPage
    :back-to="{ name: 'target-language-select' }"
    :subtitle="`Choose a ${languageName} lesson.`"
    :title="languageName"
  >
    <Transition
      name="route-fade"
      appear
    >
      <div
        v-if="isLoading"
        class="grid gap-4 sm:grid-cols-2"
      >
        <div
          v-for="item in 2"
          :key="item"
          class="skeleton h-40 rounded-box"
        />
      </div>

      <div
        v-else-if="errorMessage"
        class="alert border border-error/20 bg-error/10 text-error"
      >
        {{ errorMessage }}
      </div>

      <div
        v-else
        class="grid gap-4 sm:grid-cols-2"
      >
        <article
          v-for="lesson in lessons"
          :key="lesson.slug"
          class="card border border-base-300/70 bg-base-100 shadow-sm"
        >
          <div class="card-body gap-5">
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-2">
                <h2 class="text-2xl font-semibold tracking-tight text-base-content">
                  {{ lesson.name }}
                </h2>
                <p
                  v-if="lesson.description"
                  class="text-sm leading-6 text-base-content/70"
                >
                  {{ lesson.description }}
                </p>
              </div>

              <div class="rounded-full bg-info/12 p-3 text-info">
                <BookOpen class="size-5" />
              </div>
            </div>

            <div class="card-actions justify-start">
              <button
                class="btn btn-neutral"
                type="button"
                @click="startLesson(lesson.slug)"
              >
                <Play class="size-4" />
                Start
              </button>
            </div>
          </div>
        </article>
      </div>
    </Transition>
  </AppPage>
</template>
