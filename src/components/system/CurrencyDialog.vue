<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currenciesFor } from '@/api/rates'
import { useCurrencyStore } from '@/stores/currency'
import { useLocaleStore } from '@/stores/locale'
import UiDialog from '@/ui/UiDialog.vue'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Валюта цен» (s8-dialogs, s8-sheets-mobile): the currency shown next to
 * PKOIN, the old app's list, with search. «Только PKOIN» hides it.
 */
const open = defineModel<boolean>('open', { default: false })
const { t, locale } = useI18n()
const currency = useCurrencyStore()
const localeStore = useLocaleStore()
const query = ref('')

const names = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'currency' })
  } catch {
    return null
  }
})
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase(locale.value) + s.slice(1)

const rows = computed(() => {
  const all = [
    ...currenciesFor(localeStore.effective).map((c) => ({
      code: c.code,
      name: capitalize(names.value?.of(c.code) ?? c.code),
    })),
    { code: 'PKOIN', name: t('currency.pkoinOnly') },
  ]
  const q = query.value.trim().toLocaleLowerCase(locale.value)
  return q
    ? all.filter((r) => `${r.code} ${r.name}`.toLocaleLowerCase(locale.value).includes(q))
    : all
})

const selected = computed(() => (currency.pkoinOnly ? 'PKOIN' : currency.code))

function pick(code: string) {
  if (code === 'PKOIN') currency.setPkoinOnly()
  else currency.set(code)
  open.value = false
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('currency.dialogTitle')" :width="440">
    <div class="cur" data-testid="currency-dialog">
      <label class="cur__search">
        <UiIcon name="search" :size="18" class="cur__search-icon" />
        <span class="visually-hidden">{{ t('currency.find') }}</span>
        <input
          v-model="query"
          class="cur__input"
          type="search"
          autocomplete="off"
          :placeholder="t('currency.find')"
        />
      </label>
      <ul class="cur__list" role="listbox" :aria-label="t('currency.dialogTitle')">
        <li v-for="row in rows" :key="row.code">
          <button
            type="button"
            class="cur__row"
            role="option"
            :aria-selected="row.code === selected"
            :class="{ 'cur__row--on': row.code === selected }"
            :data-code="row.code"
            @click="pick(row.code)"
          >
            <span class="cur__code">{{ row.code === 'PKOIN' ? 'PKOIN' : row.code }}</span>
            <span class="cur__name">{{ row.name }}</span>
            <UiIcon v-if="row.code === selected" name="check" :size="20" :stroke="2.4" />
          </button>
        </li>
        <li v-if="!rows.length" class="cur__empty">{{ t('currency.nothing') }}</li>
      </ul>
      <p class="cur__note">{{ t('currency.note') }}</p>
    </div>
  </UiDialog>
</template>

<style scoped>
.cur {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cur__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--muted);
}

.cur__search-icon {
  flex: none;
  color: var(--text3);
}

.cur__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  outline: none;
}

.cur__search:focus-within {
  box-shadow: 0 0 0 3px var(--ring);
}

.cur__list {
  margin: 0 -12px;
  padding: 0;
  list-style: none;
}

.cur__row {
  width: 100%;
  min-height: 52px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
  font: 400 15px / 20px var(--font-sans);
  cursor: pointer;
}

.cur__row:hover {
  background: var(--subtle);
}

.cur__row:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--ring);
}

.cur__row--on {
  background: var(--primary-soft);
  color: var(--link);
}

.cur__row--on:hover {
  background: var(--primary-soft);
}

.cur__code {
  flex: none;
  min-width: 40px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text2);
}

.cur__row--on .cur__code {
  color: var(--link);
}

.cur__name {
  flex: 1;
}

.cur__row--on .cur__name {
  color: var(--text);
}

.cur__empty {
  padding: 16px 12px;
  color: var(--text3);
  font-size: 14px;
}

.cur__note {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}
</style>
