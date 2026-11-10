<script setup lang="ts" generic="T extends string | number">
import { nextTick, ref } from 'vue'
import type { IconName } from './icons'
import { nextIndex } from './roving'
import UiIcon from './UiIcon.vue'

export interface SegmentItem<V> {
  value: V
  label: string
  icon?: IconName
}

const props = defineProps<{ items: SegmentItem<T>[]; label?: string }>()
const model = defineModel<T>()
const buttons = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent, index: number): void {
  const next = nextIndex(event.key, index, props.items.length)
  if (next === null) return
  event.preventDefault()
  model.value = props.items[next]!.value
  void nextTick(() => buttons.value[next]?.focus())
}
</script>

<template>
  <div class="ui-segmented" role="radiogroup" :aria-label="label">
    <button
      v-for="(item, index) in items"
      :key="String(item.value)"
      ref="buttons"
      type="button"
      class="ui-segmented__item"
      :class="{ 'ui-segmented__item--active': item.value === model }"
      role="radio"
      :aria-checked="item.value === model"
      :tabindex="item.value === model ? 0 : -1"
      @click="model = item.value"
      @keydown="onKeydown($event, index)"
    >
      <UiIcon v-if="item.icon" :name="item.icon" :size="18" />
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-m);
  background: var(--muted);
}

.ui-segmented__item {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text2);
  font: 500 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
  transition:
    background-color var(--duration),
    color var(--duration);
}

.ui-segmented__item:hover {
  color: var(--text);
}

.ui-segmented__item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-segmented__item--active {
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(16, 16, 22, 0.08);
}
</style>
