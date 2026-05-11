<script setup lang="ts">
import { RotateCcw, Sparkles } from 'lucide-vue-next'

defineEmits<{
  back: []
  infinite: []
}>()
</script>

<template>
  <section class="card border border-base-300/70 bg-base-100 shadow-sm">
    <div class="card-body gap-5 sm:p-8">
      <div class="space-y-3">
        <p class="text-xs font-medium uppercase tracking-[0.18em] text-base-content/45">
          Lesson complete
        </p>
        <h2 class="text-2xl font-semibold tracking-tight text-base-content">
          Nothing is due right now.
        </h2>
        <p class="text-sm leading-6 text-base-content/70">
          You can go back or keep drilling the earliest cards.
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          class="btn btn-ghost"
          type="button"
          @click="$emit('back')"
        >
          <RotateCcw class="size-4" />
          Back to lessons
        </button>
        <button
          class="btn btn-neutral"
          type="button"
          @click="$emit('infinite')"
        >
          <Sparkles class="size-4" />
          Infinite practice
        </button>
      </div>
    </div>
  </section>
</template>
