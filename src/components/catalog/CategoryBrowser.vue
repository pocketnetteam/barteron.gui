<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import type { Category } from '@/models/categories'
import UiIcon from '@/ui/UiIcon.vue'
import UiSkeleton from '@/ui/UiSkeleton.vue'

/**
 * Category list with search and drill-down (s2-categories-mobile). `open`
 * opens a category's offers; `pick` chooses a category for a filter; `leaf`
 * chooses one an offer can be published in, without subcategories.
 */
const props = withDefaults(
  defineProps<{
    mode?: 'open' | 'pick' | 'leaf'
    /** Start inside this category. */
    start?: number | null
  }>(),
  { mode: 'open', start: null }
)
const emit = defineEmits<{ select: [id: number | null] }>()

const { t } = useI18n()
const categories = useCategories()

/** «Популярные»: what the mockup shows — phones, bikes, toys, PKOIN, furniture. */
const POPULAR = [15033, 1001, 3082, 17, 3000]

const query = ref('')
const currentId = ref<number | null>(props.start)
const tree = computed(() => categories.tree.value)
const current = computed(() => tree.value?.get(currentId.value) ?? null)
const list = computed<Category[]>(() => {
  const t2 = tree.value
  if (!t2) return []
  return currentId.value === null ? t2.roots() : t2.children(currentId.value)
})
const found = computed(() => {
  const t2 = tree.value
  const names = categories.names.value
  return t2 && names ? t2.search(query.value, names, 40) : []
})

const name = (id: number) => categories.label(id) ?? ''
const path = (id: number) =>
  (tree.value?.parents(id) ?? []).map((p) => categories.label(p.id)).join(' · ')

function enter(c: Category) {
  if (tree.value?.hasChildren(c.id)) {
    currentId.value = c.id
    query.value = ''
  } else emit('select', c.id)
}

/** A found or popular category: in `leaf` mode one with subcategories opens instead. */
function choose(id: number) {
  const c = tree.value?.get(id)
  if (props.mode === 'leaf' && c && tree.value?.hasChildren(id)) enter(c)
  else emit('select', id)
}

function back() {
  currentId.value = current.value?.parent ?? null
}
</script>

<template>
  <div class="cb" data-testid="category-browser">
    <label class="cb__search">
      <UiIcon name="search" :size="18" />
      <span class="visually-hidden">{{ t('categoriesScreen.find') }}</span>
      <input
        v-model="query"
        type="search"
        class="cb__input"
        :placeholder="t('categoriesScreen.find')"
        autocomplete="off"
      />
    </label>

    <template v-if="query.trim()">
      <ul class="cb__list">
        <li v-for="c in found" :key="c.id">
          <button type="button" class="cb__row cb__row--found" @click="choose(c.id)">
            <span class="cb__name">{{ name(c.id) }}</span>
            <span v-if="path(c.id)" class="cb__path">{{ path(c.id) }}</span>
          </button>
        </li>
      </ul>
      <p v-if="!found.length && categories.ready.value" class="cb__empty">
        {{ t('categoriesScreen.nothing') }}
      </p>
    </template>

    <template v-else>
      <section v-if="currentId === null" class="cb__popular">
        <h3 class="cb__heading">{{ t('categoriesScreen.popular') }}</h3>
        <div class="cb__chips">
          <button
            v-for="id in POPULAR"
            :key="id"
            type="button"
            class="cb__chip"
            @click="choose(id)"
          >
            {{ name(id) }}
          </button>
        </div>
      </section>

      <button v-if="current" type="button" class="cb__back" @click="back">
        <UiIcon name="chevron-left" :size="18" :stroke="2" />{{
          current.parent ? name(current.parent) : t('categoriesScreen.all')
        }}
      </button>

      <ul v-if="tree" class="cb__list">
        <li v-if="current && mode !== 'leaf'">
          <button type="button" class="cb__row cb__row--whole" @click="emit('select', current.id)">
            <span class="cb__name">{{
              mode === 'pick'
                ? t('categoriesScreen.pickWhole', { name: name(current.id) })
                : t('categoriesScreen.openWhole', { name: name(current.id) })
            }}</span>
            <UiIcon name="arrow-right" :size="18" />
          </button>
        </li>
        <li v-for="c in list" :key="c.id">
          <button type="button" class="cb__row" @click="enter(c)">
            <span class="cb__name">{{ name(c.id) }}</span>
            <UiIcon v-if="tree.hasChildren(c.id)" name="chevron-right" :size="18" />
          </button>
        </li>
      </ul>
      <div v-else class="cb__loading">
        <UiSkeleton v-for="i in 8" :key="i" height="20px" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.cb {
  display: flex;
  flex-direction: column;
}

.cb__search {
  margin: 0 16px 12px;
  height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.cb__search:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.cb__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.cb__popular {
  padding: 14px 16px 16px;
  border-top: 1px solid var(--border);
  border-bottom: 8px solid var(--page);
}

.cb__heading {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
}

.cb__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cb__chip {
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--primary-soft);
  color: var(--link);
  font: 600 13px / 18px var(--font-sans);
}

.cb__back {
  margin: 4px 16px;
  padding: 8px 0;
  border: 0;
  background: none;
  color: var(--link);
  font: 600 14px / 20px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
  text-align: left;
}

.cb__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cb__row {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cb__row .ui-icon {
  flex: none;
  color: var(--text3);
}

.cb__row:hover {
  background: var(--subtle);
}

.cb__row--whole {
  color: var(--link);
  font-weight: 600;
}

.cb__row--whole .ui-icon {
  color: var(--link);
}

.cb__row--found {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.cb__path {
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.cb__row:focus-visible,
.cb__chip:focus-visible,
.cb__back:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--ring);
}

.cb__empty {
  padding: 16px;
  color: var(--text3);
  font-size: 14px;
}

.cb__loading {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
</style>
