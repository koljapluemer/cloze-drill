<script setup lang="ts">
import { Languages } from 'lucide-vue-next'
import { ref, watch } from 'vue'

import AppPage from '@/app/AppPage.vue'
import {
  loadTargetLanguageIndex,
} from '@/entities/lesson-data/api'
import type { LanguageCatalogEntry } from '@/entities/lesson-data/model'
import { usePreferredNativeLanguage } from '@/entities/native-language-preference/api'

const errorMessage = ref('')
const isLoading = ref(true)
const languages = ref<LanguageCatalogEntry[]>([])
const preferredNativeLanguage = usePreferredNativeLanguage()

watch(
  preferredNativeLanguage,
  async (nativeLanguage) => {
    if (!nativeLanguage) {
      languages.value = []
      isLoading.value = false
      return
    }

    isLoading.value = true
    errorMessage.value = ''

    try {
      languages.value = await loadTargetLanguageIndex(nativeLanguage)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load languages.'
    } finally {
      isLoading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <AppPage
    subtitle="Pick a language and start drilling sentence clozes."
    title="Cloze Drill"
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
          class="skeleton h-36 rounded-box"
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
        <RouterLink
          v-for="language in languages"
          :key="language.code"
          :to="{ name: 'lesson-select', params: { targetLanguage: language.code } }"
          class="card border border-base-300/70 bg-base-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="card-body gap-4">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase tracking-[0.18em] text-base-content/45">
                  {{ language.code }}
                </p>
                <h2 class="text-2xl font-semibold tracking-tight text-base-content">
                  {{ language.name }}
                </h2>
              </div>
              <div class="rounded-full bg-warning/15 p-3 text-warning">
                <Languages class="size-5" />
              </div>
            </div>

            <span class="text-sm font-medium text-base-content/65">Open lessons</span>
          </div>
        </RouterLink>
      </div>
    </Transition>
  </AppPage>
</template>
