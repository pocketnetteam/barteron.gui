<script setup lang="ts">
import UiDialog from '@/ui/UiDialog.vue'
import CategoryBrowser from './CategoryBrowser.vue'

/** Choose a category for a filter: a window on the desktop, a sheet on the phone. */
defineProps<{ title: string }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ select: [id: number | null] }>()
</script>

<template>
  <UiDialog v-model:open="open" :title="title" :width="480">
    <CategoryBrowser v-if="open" class="picker" mode="pick" @select="emit('select', $event)" />
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
