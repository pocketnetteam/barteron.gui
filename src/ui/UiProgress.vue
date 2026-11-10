<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 0…1 */
  value: number
  /** Caption under the bar, e.g. «Фото 4 из 6 · 2,1 МБ». */
  caption?: string
  label?: string
}>()

const percent = computed(() => Math.round(Math.min(1, Math.max(0, props.value)) * 100))
</script>

<template>
  <div class="ui-progress">
    <div
      class="ui-progress__track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent"
      :aria-label="label"
      :aria-valuetext="caption"
    >
      <div class="ui-progress__bar" :style="{ width: `${percent}%` }" />
    </div>
    <span v-if="caption" class="ui-progress__caption">{{ caption }}</span>
  </div>
</template>

<style scoped>
.ui-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ui-progress__track {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--muted);
  overflow: hidden;
}

.ui-progress__bar {
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--primary);
  transition: width 240ms ease;
}

.ui-progress__caption {
  font-size: 12px;
  line-height: 16px;
  color: var(--text2);
}
</style>
