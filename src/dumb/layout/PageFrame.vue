<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

withDefaults(
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
  <div class="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
    <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-3">
        <RouterLink
          v-if="backTo"
          :to="backTo"
          class="inline-flex items-center gap-2 text-sm font-medium text-base-content/70 hover:text-base-content"
        >
          <ArrowLeft class="size-4" />
          {{ backLabel }}
        </RouterLink>

        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
            {{ title }}
          </h1>
          <p
            v-if="subtitle"
            class="max-w-2xl text-sm leading-6 text-base-content/70 sm:text-base"
          >
            {{ subtitle }}
          </p>
        </div>
      </div>

      <slot name="header-actions" />
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
