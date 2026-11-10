<script setup lang="ts" generic="T extends string | number">
import { nextTick, ref } from 'vue'
import { nextIndex } from './roving'

export interface TabItem<V> {
  value: V
  label: string
  count?: number
}

const props = defineProps<{ items: TabItem<T>[]; label?: string }>()
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
  <div class="ui-tabs" role="tablist" :aria-label="label">
    <button
      v-for="(item, index) in items"
      :key="String(item.value)"
      ref="buttons"
      type="button"
      class="ui-tabs__tab"
      :class="{ 'ui-tabs__tab--active': item.value === model }"
      role="tab"
      :aria-selected="item.value === model"
      :tabindex="item.value === model ? 0 : -1"
      @click="model = item.value"
      @keydown="onKeydown($event, index)"
    >
      {{ item.label }}
      <span v-if="item.count !== undefined" class="ui-tabs__count tabular">{{ item.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.ui-tabs {
  display: flex;
  gap: 28px;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}

.ui-tabs::-webkit-scrollbar {
  display: none;
}

.ui-tabs__tab {
  flex: none;
  margin-bottom: -1px;
  padding: 10px 0 12px;
  border: 0;
  border-bottom: 2.5px solid transparent;
  background: none;
  color: var(--text2);
  font: 500 15px / 20px var(--font-sans);
  display: flex;
  gap: 6px;
  transition:
    color var(--duration),
    border-color var(--duration);
}

.ui-tabs__tab:hover {
  color: var(--text);
}

.ui-tabs__tab:focus-visible {
  outline: none;
  box-shadow: inset 0 -3px 0 var(--ring);
}

.ui-tabs__tab--active {
  color: var(--text);
  font-weight: 600;
  border-bottom-color: var(--primary);
}

.ui-tabs__count {
  color: var(--text3);
  font-weight: 500;
}
</style>
