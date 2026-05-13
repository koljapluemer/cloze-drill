<script setup lang="ts">
import { Languages } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  resolveRouteForNativeLanguage,
  targetLanguageSelectRouteName,
} from '@/app/native-language-routing'
import PageFrame from '@/dumb/layout/PageFrame.vue'
import { loadNativeLanguageIndex } from '@/entities/lesson-data/api'
import type { LanguageCatalogEntry } from '@/entities/lesson-data/model'
import {
  getPreferredNativeLanguage,
  setPreferredNativeLanguage,
} from '@/entities/native-language-preference/api'

const route = useRoute()
const router = useRouter()

const errorMessage = ref('')
const isLoading = ref(true)
const languages = ref<LanguageCatalogEntry[]>([])
const selectedNativeLanguage = ref(getPreferredNativeLanguage() ?? '')

onMounted(async () => {
  try {
    languages.value = await loadNativeLanguageIndex()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load native languages.'
  } finally {
    isLoading.value = false
  }
})

async function chooseNativeLanguage(code: string): Promise<void> {
  if (!code) {
    return
  }

  errorMessage.value = ''
  selectedNativeLanguage.value = code
  setPreferredNativeLanguage(code)

  try {
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : undefined
    const targetRoute = redirect
      ? router.resolve(redirect)
      : router.resolve({ name: targetLanguageSelectRouteName })
    const nextLocation = await resolveRouteForNativeLanguage(targetRoute, code)
    await router.replace(nextLocation)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not switch native language.'
  }
}
</script>

<template>
  <PageFrame :back-to="selectedNativeLanguage ? { name: targetLanguageSelectRouteName } : undefined"
    subtitle="Pick the language you already speak." title="Set Native Language">
    <div v-if="isLoading" class="skeleton h-44 rounded-box" />

    <div v-else-if="errorMessage && languages.length === 0" class="alert border border-error/20 bg-error/10 text-error">
      {{ errorMessage }}
    </div>


    <div class="grid gap-3 sm:grid-cols-2">
      <button v-for="language in languages" :key="language.code" :class="[
        'card w-full border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        selectedNativeLanguage === language.code
          ? 'border-warning bg-warning/10'
          : 'border-base-300/70 bg-base-100',
      ]" type="button" @click="chooseNativeLanguage(language.code)">
        <div class="card-body gap-2 p-4">
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-base-content/45">
            {{ language.code }}
          </p>
          <p class="text-lg font-semibold tracking-tight text-base-content">
            {{ language.name }}
          </p>
        </div>
      </button>
    </div>

    <p v-if="errorMessage" class="text-sm text-error">
      {{ errorMessage }}
    </p>
  </PageFrame>
</template>
