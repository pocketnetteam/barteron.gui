<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import { useSearchHistoryStore } from '@/stores/search-history'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * Search hints (s2-nav-desktop, s2-search-mobile). The node has no hint
 * method, so the hints are what we know here: categories whose name matches
 * and recent searches from this device.
 */
const props = defineProps<{
  query: string
  /** Category the search runs in; `null` — everywhere. */
  scope: number | null
}>()
const emit = defineEmits<{
  search: [query: string, scope: number | null]
  category: [id: number]
}>()

const { t } = useI18n()
const categories = useCategories()
const history = useSearchHistoryStore()

const text = computed(() => props.query.trim())
const matches = computed(() => {
  const tree = categories.tree.value
  const names = categories.names.value
  if (!tree || !names || text.value.length < 2) return []
  return tree.search(text.value, names, 5).map((c) => {
    const parents = tree.parents(c.id)
    const parent = parents[parents.length - 1]
    return {
      id: c.id,
      label: categories.label(c.id) ?? '',
      parent: parent ? categories.label(parent.id) : null,
    }
  })
})
const scopeLabel = computed(() => (props.scope === null ? null : categories.label(props.scope)))

/** «велос» in «велосипед»: the typed part in bold. */
function parts(label: string): [string, string, string] {
  const at = label.toLocaleLowerCase().indexOf(text.value.toLocaleLowerCase())
  if (at < 0 || !text.value) return ['', '', label]
  return [
    label.slice(0, at),
    label.slice(at, at + text.value.length),
    label.slice(at + text.value.length),
  ]
}
</script>

<template>
  <div class="hints" data-testid="search-hints">
    <template v-if="text">
      <button
        v-if="scope !== null"
        type="button"
        class="hints__row hints__row--first"
        @click="emit('search', text, scope)"
      >
        <UiIcon name="search" :size="18" />
        <span class="hints__text"
          ><b>{{ text }}</b></span
        >
        <span class="hints__meta">{{ t('search.inCategory', { name: scopeLabel ?? '' }) }}</span>
      </button>
      <button
        type="button"
        class="hints__row"
        :class="{ 'hints__row--first': scope === null }"
        @click="emit('search', text, null)"
      >
        <UiIcon name="search" :size="18" />
        <span class="hints__text"
          ><b>{{ text }}</b></span
        >
        <span class="hints__meta">{{ t('search.everywhere') }}</span>
      </button>
      <button
        v-for="m in matches"
        :key="m.id"
        type="button"
        class="hints__row"
        @click="emit('category', m.id)"
      >
        <UiIcon name="tiles" :size="18" />
        <span class="hints__text"
          >{{ parts(m.label)[0] }}<b>{{ parts(m.label)[1] }}</b
          >{{ parts(m.label)[2] }}</span
        >
        <span class="hints__meta">{{
          m.parent ? t('search.inCategory', { name: m.parent }) : t('search.category')
        }}</span>
      </button>
    </template>

    <template v-if="history.items.length">
      <span v-if="text" class="hints__divider" aria-hidden="true" />
      <div class="hints__head">
        <span>{{ t('search.recent') }}</span>
        <button type="button" class="hints__clear" @click="history.clear()">
          {{ t('search.clear') }}
        </button>
      </div>
      <div v-for="item in history.items" :key="item" class="hints__recent">
        <button
          type="button"
          class="hints__row hints__row--recent"
          @click="emit('search', item, scope)"
        >
          <UiIcon name="clock" :size="18" />
          <span class="hints__text">{{ item }}</span>
        </button>
        <button
          type="button"
          class="hints__remove"
          :aria-label="t('search.remove', { query: item })"
          @click="history.remove(item)"
        >
          <UiIcon name="close" :size="16" :stroke="2" />
        </button>
      </div>
      <p class="hints__note">{{ t('search.historyNote') }}</p>
    </template>

    <p v-if="!text && !history.items.length" class="hints__note">{{ t('search.empty') }}</p>
  </div>
</template>

<style scoped>
.hints {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.hints__row {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
}

.hints__row .ui-icon {
  flex: none;
  color: var(--text3);
}

.hints__row:hover,
.hints__row--first {
  background: var(--muted);
}

.hints__row:focus-visible,
.hints__remove:focus-visible,
.hints__clear:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--ring);
}

.hints__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hints__meta {
  flex: none;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text3);
}

.hints__divider {
  height: 1px;
  margin: 6px 12px;
  background: var(--border);
}

.hints__head {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--text3);
}

.hints__clear {
  padding: 2px 4px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--link);
  font: 600 13px / 18px var(--font-sans);
}

.hints__recent {
  display: flex;
  align-items: center;
}

.hints__row--recent {
  min-height: 40px;
}

.hints__remove {
  flex: none;
  width: 32px;
  height: 32px;
  margin-right: 6px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hints__remove:hover {
  background: var(--muted);
  color: var(--text);
}

.hints__note {
  margin: 0;
  padding: 8px 12px 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}
</style>
