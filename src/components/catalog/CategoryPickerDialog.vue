<script setup lang="ts">
import UiDialog from '@/ui/UiDialog.vue'
import CategoryBrowser from './CategoryBrowser.vue'

/**
 * Choose a category: a window on the desktop, a sheet on the phone. `pick` —
 * for a filter, any level; `leaf` — for an offer, one without subcategories.
 */
withDefaults(defineProps<{ title: string; mode?: 'pick' | 'leaf'; start?: number | null }>(), {
  mode: 'pick',
  start: null,
})
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [id: number | null] }>()
</script>

<template>
  <UiDialog v-model:open="open" :title="title" :width="480">
    <CategoryBrowser
      v-if="open"
      class="picker"
      :mode="mode"
      :start="start"
      @select="emit('select', $event)"
    />
  </UiDialog>
</template>

<style scoped>
.picker {
  margin: 0 -24px -8px;
  max-height: 60vh;
  overflow-y: auto;
}

@media (max-width: 767px) {
  .picker {
    margin: 0 -16px;
  }
}
</style>
