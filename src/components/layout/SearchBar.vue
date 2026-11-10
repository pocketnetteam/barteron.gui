<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'

/** Desktop search: query, optional category scope, «Найти». */
defineProps<{
  placeholder?: string
  /** «Во всех категориях»: shows the scope button. */
  scope?: string
  size?: 44 | 48
}>()
const query = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [query: string]; scope: [] }>()
const { t } = useI18n()
</script>

<template>
  <form
    class="search"
    :class="size === 48 ? 'search--h48' : ''"
    role="search"
    @submit.prevent="emit('submit', query.trim())"
  >
    <label class="search__field">
      <UiIcon class="search__icon" name="search" :size="20" />
      <span class="visually-hidden">{{ placeholder ?? t('header.searchPlaceholder') }}</span>
      <input
        v-model="query"
        class="search__input"
        type="search"
        enterkeyhint="search"
        :placeholder="placeholder ?? t('header.searchPlaceholder')"
      />
    </label>
    <button v-if="scope" type="button" class="search__scope" @click="emit('scope')">
      {{ scope }}
      <UiIcon name="chevron" :size="16" :stroke="2" />
    </button>
    <button type="submit" class="search__submit">{{ t('header.find') }}</button>
  </form>
</template>

<style scoped>
.search {
  box-sizing: border-box;
  height: 44px;
  min-width: 0;
  border: 2px solid var(--primary);
  border-radius: var(--radius-m);
  background: var(--surface);
  display: flex;
  align-items: center;
  overflow: hidden;
}

.search--h48 {
  height: 48px;
}

.search:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.search__field {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  cursor: text;
}

.search__icon {
  color: var(--text3);
}

.search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.search__input::placeholder {
  color: var(--text3);
  opacity: 1;
}

.search__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

.search__scope {
  flex: none;
  height: 100%;
  padding: 0 12px;
  border: 0;
  border-left: 1px solid var(--border);
  background: var(--subtle);
  color: var(--text2);
  font: 500 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
}

.search__submit {
  flex: none;
  height: 100%;
  padding: 0 22px;
  border: 0;
  background: var(--primary);
  color: #ffffff;
  font: 600 15px / 20px var(--font-sans);
}

.search__submit:hover {
  background: var(--primary-hover);
}

.search__scope:focus-visible,
.search__submit:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--ring);
}
</style>
