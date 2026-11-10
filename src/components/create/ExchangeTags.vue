<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferForm } from '@/composables/offer-form'
import { PKOIN_CATEGORY, QUICK_EXCHANGE } from '@/models/draft'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Свой список» (s4-step3): categories of any level, as the old form allowed.
 * The mockup also had free words; the offer format has no place for them
 * (`a` holds category ids), so only categories are offered.
 */
const { t } = useI18n()
const form = useOfferForm()
const { categories } = form
const d = computed(() => form.draft.value!)

const query = ref('')
const label = (id: number) => categories.label(id) ?? String(id)
const parentName = (id: number) => {
  const parents = categories.tree.value?.parents(id) ?? []
  const parent = parents[parents.length - 1]
  return parent ? categories.label(parent.id) : null
}

const found = computed(() => {
  const tree = categories.tree.value
  const names = categories.names.value
  if (!tree || !names || !query.value.trim()) return []
  return tree
    .search(query.value, names, 8)
    .map((c) => c.id)
    .filter((id) => !d.value.tags.includes(id))
})
const quick = computed(() => QUICK_EXCHANGE.filter((id) => !d.value.tags.includes(id)))

function add(id: number) {
  if (!d.value.tags.includes(id)) d.value.tags.push(id)
  query.value = ''
}
function remove(id: number) {
  d.value.tags = d.value.tags.filter((tag) => tag !== id)
}
function onEnter() {
  const first = found.value[0]
  if (first !== undefined) add(first)
}
</script>

<template>
  <div class="xt" data-field="tags">
    <ul v-if="d.tags.length" class="xt__chips">
      <li v-for="id in d.tags" :key="id">
        <span class="xt__chip" :class="{ 'xt__chip--pkoin': id === PKOIN_CATEGORY }">
          {{ label(id) }}
          <button
            type="button"
            class="xt__remove"
            :aria-label="t('create.exchange.removeTag', { name: label(id) })"
            @click="remove(id)"
          >
            <UiIcon name="close" :size="14" :stroke="2.4" />
          </button>
        </span>
      </li>
    </ul>

    <label class="xt__input">
      <UiIcon name="plus" :size="18" />
      <span class="visually-hidden">{{ t('create.exchange.add') }}</span>
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="t('create.exchange.placeholder')"
        data-testid="create-tag-input"
        @keydown.enter.prevent="onEnter"
      />
    </label>

    <ul v-if="query.trim()" class="xt__found" :aria-label="t('create.exchange.add')">
      <li v-for="id in found" :key="id">
        <button type="button" class="xt__option" :data-testid="`create-tag-${id}`" @click="add(id)">
          <span class="xt__option-name">{{ label(id) }}</span>
          <span v-if="parentName(id)" class="xt__option-path">{{ parentName(id) }}</span>
        </button>
      </li>
      <li v-if="!found.length && categories.ready.value" class="xt__none">
        {{ t('create.exchange.nothingFound') }}
      </li>
    </ul>
    <div v-else-if="quick.length" class="xt__quick">
      <span class="xt__quick-title">{{ t('create.exchange.quick') }}</span>
      <div class="xt__quick-list">
        <button
          v-for="id in quick"
          :key="id"
          type="button"
          class="xt__quick-chip"
          :data-testid="`create-quick-${id}`"
          @click="add(id)"
        >
          <UiIcon name="plus" :size="14" :stroke="2.4" />{{ label(id) }}
        </button>
      </div>
    </div>

    <p v-if="form.fieldError('tags')" class="xt__error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('tags') }}
    </p>
    <p class="xt__hint">{{ t('create.exchange.tagsHint') }}</p>
  </div>
</template>

<style scoped>
.xt {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.xt__chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.xt__chip {
  height: 36px;
  padding: 0 6px 0 12px;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--link);
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.xt__chip--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}

.xt__remove {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.xt__remove:focus-visible,
.xt__option:focus-visible,
.xt__quick-chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.xt__input {
  height: 48px;
  padding: 0 14px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text3);
}

.xt__input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--ring);
}

.xt__input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 16px;
}

.xt__found {
  list-style: none;
  margin: -4px 0 0;
  padding: 6px;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--shadow-2);
  display: flex;
  flex-direction: column;
}

.xt__option {
  width: 100%;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
  cursor: pointer;
}

.xt__option:hover {
  background: var(--muted);
}

.xt__option-path {
  font-size: 12px;
  color: var(--text3);
}

.xt__none {
  padding: 10px;
  font-size: 14px;
  color: var(--text3);
}

.xt__quick {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xt__quick-title {
  font-size: 13px;
  color: var(--text2);
}

.xt__quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.xt__quick-chip {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.xt__quick-chip:hover {
  border-color: var(--primary);
}

.xt__error {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

.xt__hint {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}
</style>
