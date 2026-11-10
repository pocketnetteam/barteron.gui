<script setup lang="ts">
import UiIcon from './UiIcon.vue'

withDefaults(defineProps<{ size?: number; stroke?: number }>(), { size: 18, stroke: 2.4 })
</script>

<template>
  <UiIcon class="ui-spinner" name="spinner" :size="size" :stroke="stroke" />
</template>

<style scoped>
.ui-spinner {
  animation: ui-spin 0.8s linear infinite;
}

@keyframes ui-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
