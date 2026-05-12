<script setup lang="ts">
import { Languages } from 'lucide-vue-next'

import PageFrame from '@/dumb/layout/PageFrame.vue'
import { nativeLanguageSelectRouteName } from '@/app/native-language-routing'

const props = withDefaults(
  defineProps<{
    backLabel?: string
    backTo?: { name: string; params?: Record<string, string> }
    subtitle?: string
    title: string
  }>(),
  {
    backLabel: 'Back',
    backTo: undefined,
    subtitle: undefined,
  },
)
</script>

<template>
  <PageFrame
    :back-label="props.backLabel"
    :back-to="props.backTo"
    :subtitle="props.subtitle"
    :title="props.title"
  >
    <template #header-actions>
      <slot name="header-actions" />
    </template>

    <div class="flex flex-1 flex-col">
      <div class="flex-1">
        <slot />
      </div>

      <footer class="mt-8 border-t border-base-300/70 pt-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <RouterLink
            :to="{ name: nativeLanguageSelectRouteName }"
            class="btn btn-outline self-start"
          >
            <Languages class="size-4" />
            Change native language
          </RouterLink>
        </div>
      </footer>
    </div>
  </PageFrame>
</template>
