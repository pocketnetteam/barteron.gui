<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'

/** Phone top: search (opens the search screen), filters, and a row of chips (slot). */
defineProps<{
  /** «Поиск в Москве» */
  placeholder: string
  /** Some filters are on: a dot on the filters button. */
  filtersActive?: boolean
}>()
defineEmits<{ search: []; filters: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="mtop">
    <div class="mtop__row">
      <button type="button" class="mtop__search" @click="$emit('search')">
        <UiIcon name="search" :size="20" />
        <span>{{ placeholder }}</span>
      </button>
      <button
        type="button"
        class="mtop__filters"
        :aria-label="filtersActive ? t('header.filtersActive') : t('header.filters')"
        @click="$emit('filters')"
      >
        <UiIcon name="filters" :size="22" />
        <span v-if="filtersActive" class="mtop__dot" aria-hidden="true" />
      </button>
    </div>
    <div v-if="$slots.default" class="mtop__chips"><slot /></div>
  </div>
</template>

<style scoped>
.mtop {
  padding: 10px 16px;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mtop__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mtop__search {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text3);
  font: 400 15px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.mtop__search span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mtop__filters {
  position: relative;
  flex: none;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mtop__search:focus-visible,
.mtop__filters:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.mtop__dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--primary);
}

.mtop__chips {
  display: flex;
  gap: 8px;
  margin: 0 -16px;
  padding: 0 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.mtop__chips::-webkit-scrollbar {
  display: none;
}
</style>
