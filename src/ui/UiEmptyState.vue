<script setup lang="ts">
import type { IconName } from './icons'
import UiIcon from './UiIcon.vue'

defineProps<{ icon?: IconName; title: string; text?: string }>()
</script>

<template>
  <div class="ui-empty">
    <span v-if="icon" class="ui-empty__icon"><UiIcon :name="icon" :size="28" :stroke="1.6" /></span>
    <span class="ui-empty__title">{{ title }}</span>
    <span v-if="text" class="ui-empty__text">{{ text }}</span>
    <div v-if="$slots.default" class="ui-empty__actions"><slot /></div>
  </div>
</template>

<style scoped>
.ui-empty {
  padding: 28px 24px;
  border-radius: var(--radius-l);
  background: var(--subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.ui-empty__icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-empty__title {
  font-size: 17px;
  line-height: 24px;
  font-weight: 700;
}

.ui-empty__text {
  max-width: 300px;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.ui-empty__actions {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
