<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategories } from '@/api/queries'
import type { useMyAccount } from '@/composables/my-account'
import { PKOIN_CATEGORY } from '@/models/draft'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import AccountNotice from './AccountNotice.vue'

const CategoryPickerDialog = defineAsyncComponent(
  () => import('@/components/catalog/CategoryPickerDialog.vue')
)

/**
 * «Мой список обмена» (s5-settings-desktop): categories I take for offers
 * that say «Мой список». Saved to my Barteron profile (`a` of tx 104), so the
 * old app and the node's matching see it too. Any level, as in the old app.
 */
const props = defineProps<{ account: ReturnType<typeof useMyAccount>; untitled?: boolean }>()
const { t } = useI18n()
const categories = useCategories()

const saved = computed(() => props.account.shown.value?.tags ?? [])
const tags = ref<number[]>([...saved.value])
watch(
  () => saved.value.join(','),
  () => (tags.value = [...saved.value])
)
const changed = computed(() => tags.value.join(',') !== saved.value.join(','))
const locked = computed(() => props.account.pending.value || !props.account.canSave.value)

const label = (id: number) => categories.label(id) ?? `#${id}`
const pickerOpen = ref(false)

function add(id: number | null) {
  pickerOpen.value = false
  if (id === null || tags.value.includes(id)) return
  tags.value = [...tags.value, id]
}
const remove = (id: number) => (tags.value = tags.value.filter((x) => x !== id))

function save() {
  if (!changed.value || locked.value) return
  const next = [...tags.value]
  props.account.save((a) => ({ ...a, tags: next }))
}
</script>

<template>
  <div class="ml" data-testid="mylist">
    <div v-if="!untitled" class="ml__head">
      <h2 class="ml__title">{{ t('settings.mylist.title') }}</h2>
      <p class="ml__text">{{ t('settings.mylist.text') }}</p>
    </div>
    <AccountNotice :account="account" />
    <ul v-if="tags.length" class="ml__chips" :class="{ 'ml__chips--locked': locked }">
      <li v-for="id in tags" :key="id">
        <span
          class="ml__chip"
          :class="{ 'ml__chip--pkoin': id === PKOIN_CATEGORY }"
          :data-testid="`mylist-tag-${id}`"
        >
          {{ label(id) }}
          <button
            v-if="!locked"
            type="button"
            class="ml__remove"
            :aria-label="t('settings.mylist.remove', { name: label(id) })"
            @click="remove(id)"
          >
            <UiIcon name="close" :size="14" :stroke="2.4" />
          </button>
        </span>
      </li>
      <li v-if="!locked">
        <button type="button" class="ml__add" data-testid="mylist-add" @click="pickerOpen = true">
          <UiIcon name="plus" :size="16" :stroke="2" />{{ t('settings.mylist.add') }}
        </button>
      </li>
    </ul>
    <div v-else-if="!account.query.isError.value" class="ml__empty">
      <span>{{ t('settings.mylist.empty') }}</span>
      <button
        v-if="!locked"
        type="button"
        class="ml__add"
        data-testid="mylist-add"
        @click="pickerOpen = true"
      >
        <UiIcon name="plus" :size="16" :stroke="2" />{{ t('settings.mylist.add') }}
      </button>
    </div>
    <p v-if="account.pending.value" class="ml__hint">{{ t('account.locked') }}</p>
    <div v-else class="ml__actions">
      <UiButton :size="40" :disabled="!changed || locked" data-testid="mylist-save" @click="save">{{
        t('wallet.save')
      }}</UiButton>
      <UiButton v-if="changed" variant="neutral" :size="40" @click="tags = [...saved]">{{
        t('wallet.cancel')
      }}</UiButton>
      <span class="ml__hint">{{ t('account.savedHint') }}</span>
    </div>

    <CategoryPickerDialog
      v-if="pickerOpen"
      v-model:open="pickerOpen"
      :title="t('settings.mylist.pick')"
      @select="add"
    />
  </div>
</template>

<style scoped>
.ml {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ml__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ml__title {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  font-weight: 700;
}

.ml__text,
.ml__hint {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--text2);
}

.ml__chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ml__chips--locked {
  opacity: 0.6;
}

.ml__chip {
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

.ml__chips--locked .ml__chip {
  padding-right: 12px;
}

.ml__chip--pkoin {
  background: var(--pkoin-soft);
  color: var(--pkoin);
}

.ml__remove {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.ml__add {
  height: 36px;
  padding: 0 12px;
  border: 1px dashed var(--border-strong);
  border-radius: 10px;
  background: transparent;
  color: var(--text2);
  font: 500 14px / 20px var(--font-sans);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.ml__add:hover {
  color: var(--text);
  border-color: var(--text3);
}

.ml__remove:focus-visible,
.ml__add:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ml__empty {
  padding: 16px;
  border-radius: var(--radius-m);
  background: var(--subtle);
  color: var(--text2);
  font-size: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ml__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
</style>
