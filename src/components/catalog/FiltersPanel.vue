<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'
import { useCategories } from '@/api/queries'
import { categoryRoute, searchQuery } from '@/composables/catalog-nav'
import { useLocationLabel } from '@/components/layout/location-label'
import {
  DELIVERY_WAYS,
  FREQUENT_EXCHANGE,
  PRICE_PRESETS,
  type CatalogFilters,
  type Condition,
} from '@/models/filters'
import UiCheckbox from '@/ui/UiCheckbox.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiSwitch from '@/ui/UiSwitch.vue'
import CategoryPickerDialog from './CategoryPickerDialog.vue'

/**
 * Catalog filters (s2-catalog-desktop aside, s2-filters-mobile). The panel
 * edits a draft; the page applies it with «Показать». «новое» marks the
 * filters the old app did not have.
 */
const props = withDefaults(
  defineProps<{
    category: number | null
    /** `aside` — desktop column; `sheet` — the phone screen. */
    variant?: 'aside' | 'sheet'
    /** The viewer has a profile list for «То, что есть в моём списке». */
    myList?: boolean
    /** Where «Изменить на карте» leads. */
    mapRoute: RouteLocationRaw
  }>(),
  { variant: 'aside', myList: false }
)
const draft = defineModel<CatalogFilters>({ required: true })
defineEmits<{ categories: []; location: [] }>()

const { t, locale } = useI18n()
const categories = useCategories()
const locationLabel = useLocationLabel(', ')

const tree = computed(() => categories.tree.value)
const current = computed(() => tree.value?.get(props.category) ?? null)
const parent = computed(() =>
  current.value?.parent ? tree.value?.get(current.value.parent) : null
)
const children = computed(() =>
  current.value ? (tree.value?.children(current.value.id) ?? []) : []
)
const roots = computed(() => (current.value ? [] : (tree.value?.roots() ?? [])))
const name = (id: number) => categories.label(id) ?? ''

const num = (n: number) => new Intl.NumberFormat(locale.value).format(n)
function presetLabel([min, max]: readonly [number | null, number | null]) {
  if (min === null) return t('filters.priceUpTo', { n: num(max!) })
  if (max === null) return t('filters.priceFrom', { n: num(min) })
  return `${num(min)}–${num(max)}`
}

const minText = ref('')
const maxText = ref('')
/** The fields follow the draft, except while the user types in them. */
let typing = false
watch(
  () => [draft.value.priceMin, draft.value.priceMax] as const,
  ([min, max]) => {
    if (typing) {
      typing = false
      return
    }
    minText.value = min === null ? '' : String(min)
    maxText.value = max === null ? '' : String(max)
  },
  { immediate: true }
)
const parsePrice = (text: string) => {
  const n = Number(text.replace(',', '.').replace(/\s/g, ''))
  return text.trim() && Number.isFinite(n) && n > 0 ? n : null
}
function onPrice() {
  typing = true
  draft.value = {
    ...draft.value,
    priceMin: parsePrice(minText.value),
    priceMax: parsePrice(maxText.value),
    free: false,
  }
}
function pickPreset([min, max]: readonly [number | null, number | null]) {
  const same = draft.value.priceMin === min && draft.value.priceMax === max
  draft.value = {
    ...draft.value,
    priceMin: same ? null : min,
    priceMax: same ? null : max,
    free: false,
  }
}
const presetOn = (p: readonly [number | null, number | null]) =>
  !draft.value.free && draft.value.priceMin === p[0] && draft.value.priceMax === p[1]

const free = computed({
  get: () => draft.value.free,
  set: (value: boolean) => (draft.value = { ...draft.value, free: value }),
})

const picker = ref(false)
function addExchange(id: number | null) {
  picker.value = false
  if (id === null || draft.value.exchange.includes(id)) return
  draft.value = { ...draft.value, exchange: [...draft.value.exchange, id] }
}
const removeExchange = (id: number) =>
  (draft.value = { ...draft.value, exchange: draft.value.exchange.filter((x) => x !== id) })
const frequent = computed(() =>
  FREQUENT_EXCHANGE.filter((id) => !draft.value.exchange.includes(id))
)
const myListOn = computed({
  get: () => draft.value.myList,
  set: (value: boolean) => (draft.value = { ...draft.value, myList: value }),
})

const condition = computed({
  get: () => draft.value.condition ?? 'any',
  set: (value: Condition | 'any') =>
    (draft.value = { ...draft.value, condition: value === 'any' ? null : value }),
})
const conditionItems = computed(() => [
  { value: 'any' as const, label: t('filters.conditionAny') },
  { value: 'new' as const, label: t('offer.condition.new') },
  { value: 'used' as const, label: t('offer.condition.used') },
])

function toggleDelivery(way: (typeof DELIVERY_WAYS)[number], on: boolean) {
  const rest = draft.value.delivery.filter((w) => w !== way)
  draft.value = {
    ...draft.value,
    delivery: on ? DELIVERY_WAYS.filter((w) => w === way || rest.includes(w)) : rest,
  }
}
const safeDeal = computed({
  get: () => draft.value.safeDeal,
  set: (value: boolean) => (draft.value = { ...draft.value, safeDeal: value }),
})
</script>

<template>
  <div class="fp" :class="`fp--${variant}`" data-testid="filters">
    <section v-if="variant === 'aside'" class="fp__section">
      <h3 class="fp__title">{{ t('filters.category') }}</h3>
      <template v-if="current">
        <RouterLink
          class="fp__up"
          :to="categoryRoute(parent?.id ?? null, searchQuery(draft.search))"
        >
          <UiIcon name="chevron-left" :size="14" :stroke="2.2" />{{
            parent ? name(parent.id) : t('filters.allCategories')
          }}
        </RouterLink>
        <span class="fp__current">{{ name(current.id) }}</span>
        <div class="fp__children">
          <RouterLink
            v-for="c in children"
            :key="c.id"
            class="fp__child"
            :to="categoryRoute(c.id, searchQuery(draft.search))"
          >
            {{ name(c.id) }}
          </RouterLink>
        </div>
      </template>
      <div v-else class="fp__children fp__children--roots">
        <RouterLink
          v-for="c in roots"
          :key="c.id"
          class="fp__child"
          :to="categoryRoute(c.id, searchQuery(draft.search))"
        >
          {{ name(c.id) }}
        </RouterLink>
      </div>
    </section>

    <template v-else>
      <button type="button" class="fp__row" @click="$emit('categories')">
        <span class="fp__row-text">
          <span class="fp__row-label">{{ t('filters.category') }}</span>
          <span class="fp__row-value">{{
            current ? name(current.id) : t('filters.allCategories')
          }}</span>
        </span>
        <UiIcon name="chevron-right" :size="20" />
      </button>
      <button type="button" class="fp__row fp__row--last" @click="$emit('location')">
        <span class="fp__row-text">
          <span class="fp__row-label">{{ t('filters.where') }}</span>
          <span class="fp__row-value">{{ locationLabel }}</span>
        </span>
        <UiIcon name="chevron-right" :size="20" />
      </button>
    </template>

    <section class="fp__section">
      <h3 class="fp__title">{{ t('filters.price') }}</h3>
      <div class="fp__prices">
        <label class="fp__price">
          {{ t('filters.from') }}
          <input
            v-model="minText"
            class="fp__price-input"
            inputmode="decimal"
            :aria-label="t('filters.priceMinLabel')"
            @input="onPrice"
          />
        </label>
        <label class="fp__price">
          {{ t('filters.to') }}
          <input
            v-model="maxText"
            class="fp__price-input"
            inputmode="decimal"
            :aria-label="t('filters.priceMaxLabel')"
            @input="onPrice"
          />
        </label>
      </div>
      <div class="fp__chips">
        <button
          v-for="p in PRICE_PRESETS"
          :key="presetLabel(p)"
          type="button"
          class="fp__chip"
          :class="{ 'fp__chip--on': presetOn(p) }"
          :aria-pressed="presetOn(p)"
          @click="pickPreset(p)"
        >
          {{ presetLabel(p) }}
        </button>
      </div>
      <label v-if="variant === 'aside'" class="fp__check">
        <UiCheckbox v-model="free" />{{ t('filters.free') }}
      </label>
      <label v-else class="fp__switch"> {{ t('filters.free') }}<UiSwitch v-model="free" /> </label>
    </section>

    <section class="fp__section">
      <div>
        <h3 class="fp__title">{{ t('filters.exchange') }}</h3>
        <p class="fp__hint">{{ t('filters.exchangeHint') }}</p>
      </div>
      <div class="fp__chips">
        <span v-for="id in draft.exchange" :key="id" class="fp__tag">
          {{ name(id) }}
          <button
            type="button"
            class="fp__tag-remove"
            :aria-label="t('filters.removeCategory', { name: name(id) })"
            @click="removeExchange(id)"
          >
            <UiIcon name="close" :size="12" :stroke="2.6" />
          </button>
        </span>
        <button type="button" class="fp__add" @click="picker = true">
          <UiIcon name="plus" :size="14" :stroke="2.2" />{{ t('filters.addCategory') }}
        </button>
      </div>
      <div v-if="frequent.length" class="fp__frequent">
        <span class="fp__small">{{ t('filters.frequent') }}</span>
        <div class="fp__chips">
          <button
            v-for="id in frequent"
            :key="id"
            type="button"
            class="fp__chip"
            @click="addExchange(id)"
          >
            + {{ name(id) }}
          </button>
        </div>
      </div>
      <label v-if="myList" class="fp__switch" :class="{ 'fp__switch--start': variant === 'aside' }">
        <template v-if="variant === 'aside'"
          ><UiSwitch v-model="myListOn" />{{ t('filters.myList') }}</template
        >
        <template v-else>{{ t('filters.myList') }}<UiSwitch v-model="myListOn" /></template>
      </label>
    </section>

    <section class="fp__section">
      <h3 class="fp__title">
        {{ t('filters.condition') }}<span class="fp__new">{{ t('filters.new') }}</span>
      </h3>
      <UiSegmented v-model="condition" :items="conditionItems" :label="t('filters.condition')" />
    </section>

    <section class="fp__section">
      <h3 class="fp__title">
        {{ t('filters.delivery') }}<span class="fp__new">{{ t('filters.new') }}</span>
      </h3>
      <label v-for="way in DELIVERY_WAYS" :key="way" class="fp__check">
        <UiCheckbox
          :model-value="draft.delivery.includes(way)"
          @update:model-value="toggleDelivery(way, $event)"
        />{{ t(`filters.way.${way}`) }}
      </label>
      <label class="fp__switch">{{ t('filters.safeDeal') }}<UiSwitch v-model="safeDeal" /></label>
    </section>

    <section v-if="variant === 'aside'" class="fp__section fp__section--last">
      <h3 class="fp__title">{{ t('filters.where') }}</h3>
      <div class="fp__where">
        <UiIcon name="location" :size="20" />
        <div class="fp__where-text">
          <span class="fp__where-place">{{ locationLabel }}</span>
          <RouterLink class="fp__where-link" :to="mapRoute">{{
            t('filters.changeOnMap')
          }}</RouterLink>
        </div>
      </div>
    </section>

    <CategoryPickerDialog
      v-model:open="picker"
      :title="t('filters.exchangePick')"
      @select="addExchange"
    />
  </div>
</template>

<style scoped>
.fp {
  display: flex;
  flex-direction: column;
}

.fp__section {
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fp__section--last {
  border-bottom: 0;
}

.fp--sheet .fp__section {
  padding: 20px 16px;
}

.fp__title {
  margin: 0;
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fp--sheet .fp__title {
  font-size: 17px;
  line-height: 24px;
}

.fp__hint {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text3);
}

.fp__new {
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--info-soft);
  color: var(--info);
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
}

.fp__up {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 18px;
  color: var(--link);
  text-decoration: none;
}

.fp__current {
  padding-left: 18px;
  font-size: 14px;
  font-weight: 600;
}

.fp__children {
  padding-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fp__children--roots {
  padding-left: 0;
  max-height: 360px;
  overflow-y: auto;
}

.fp__child {
  font-size: 14px;
  line-height: 18px;
  color: var(--text2);
  text-decoration: none;
}

.fp__child:hover,
.fp__up:hover {
  color: var(--link);
  text-decoration: none;
}

.fp__row {
  min-height: 62px;
  padding: 8px 16px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.fp__row--last {
  border-bottom: 8px solid var(--page);
}

.fp__row .ui-icon {
  color: var(--text3);
}

.fp__row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fp__row-label {
  font-size: 13px;
  line-height: 16px;
  color: var(--text3);
}

.fp__row-value {
  font-size: 15px;
  line-height: 20px;
}

.fp__prices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.fp__price {
  box-sizing: border-box;
  height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-m);
  background: var(--muted);
  color: var(--text3);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fp--sheet .fp__price {
  height: 48px;
}

.fp__price:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.fp__price-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.fp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fp__chip {
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text);
  font: 400 13px / 18px var(--font-sans);
}

.fp--sheet .fp__chip {
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
}

.fp__chip:hover {
  background: var(--muted-hover);
}

.fp__chip--on,
.fp__chip--on:hover {
  background: var(--contrast);
  color: var(--on-contrast);
  font-weight: 600;
}

.fp__tag {
  height: 32px;
  padding: 0 4px 0 12px;
  border-radius: var(--radius-s);
  background: var(--primary-soft);
  color: var(--link);
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
}

.fp__tag-remove {
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fp__add {
  height: 32px;
  padding: 0 10px;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-s);
  background: transparent;
  color: var(--text2);
  font: 500 13px / 18px var(--font-sans);
  display: flex;
  align-items: center;
  gap: 4px;
}

.fp__add:hover {
  color: var(--text);
  border-color: var(--text3);
}

.fp__frequent {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fp__small {
  font-size: 12px;
  color: var(--text3);
}

.fp__check {
  min-height: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
}

.fp--sheet .fp__check {
  min-height: 36px;
  font-size: 15px;
}

.fp__switch {
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
}

.fp--sheet .fp__switch {
  font-size: 15px;
}

.fp__switch--start {
  justify-content: flex-start;
}

.fp__where {
  padding: 12px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  display: flex;
  align-items: center;
  gap: 10px;
}

.fp__where .ui-icon {
  flex: none;
  color: var(--link);
}

.fp__where-text {
  display: flex;
  flex-direction: column;
}

.fp__where-place {
  font-size: 14px;
  font-weight: 600;
}

.fp__where-link {
  font-size: 13px;
  color: var(--link);
  text-decoration: none;
}

.fp__chip:focus-visible,
.fp__add:focus-visible,
.fp__tag-remove:focus-visible,
.fp__row:focus-visible,
.fp__up:focus-visible,
.fp__child:focus-visible,
.fp__where-link:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
