<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
    /** CSS aspect-ratio instead of a height, e.g. «4 / 3» for a photo. */
    ratio?: string
  }>(),
  { width: '100%', height: '12px', radius: '6px' }
)
</script>

<template>
  <span
    class="ui-skeleton"
    :style="{
      width,
      height: ratio ? 'auto' : height,
      aspectRatio: ratio,
      borderRadius: radius,
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
.ui-skeleton {
  display: block;
  background: var(--skeleton);
  animation: ui-skeleton 1.4s ease-in-out infinite;
}

@keyframes ui-skeleton {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
</style>
