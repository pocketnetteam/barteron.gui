<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppShell from '@/components/layout/AppShell.vue'
import MobileTopBar from '@/components/layout/MobileTopBar.vue'
import TabBar, { type TabItem } from '@/components/layout/TabBar.vue'
import { LOCALES, setLocale, type Locale } from '@/i18n'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import UiChip from '@/ui/UiChip.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiSelect from '@/ui/UiSelect.vue'
import { showToast } from '@/ui/toast'
import SheetComponents from './SheetComponents.vue'
import SheetData from './SheetData.vue'
import SheetFoundations from './SheetFoundations.vue'
import SheetMarketplace from './SheetMarketplace.vue'

/**
 * Internal design system showcase (dev and test builds). Three tabs follow the
 * prototype sheets foundations / components / marketplace, so they can be
 * compared side by side in both themes. The fourth shows the data layer
 * (stage 2) on the mock network.
 */
type Sheet = 'foundations' | 'components' | 'marketplace' | 'data'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()
const { t, locale } = useI18n()

const sheet = computed<Sheet>({
  get: () => (route.params.sheet as Sheet) || 'foundations',
  set: (value) => void router.replace({ name: 'showcase', params: { sheet: value } }),
})

const SHEETS = [
  { value: 'foundations' as const, label: 'Основы' },
  { value: 'components' as const, label: 'Компоненты' },
  { value: 'marketplace' as const, label: 'Маркетплейс' },
  { value: 'data' as const, label: 'Данные' },
]

const themeItems = computed(() =>
  (['system', 'light', 'dark'] as ThemePreference[]).map((value) => ({
    value,
    label: t(`theme.option.${value}`),
  }))
)

const themeModel = computed({
  get: () => theme.preference,
  set: (value: ThemePreference) => theme.setPreference(value),
})

const LOCALE_NAMES: Record<Locale, string> = { ru: 'Русский', en: 'English', sr: 'Српски' }
const localeModel = computed({
  get: () => locale.value as Locale,
  set: (value: Locale) => void setLocale(value),
})
const localeOptions = LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value] }))

function cycleTheme(): void {
  const order: ThemePreference[] = ['system', 'light', 'dark']
  theme.setPreference(order[(order.indexOf(theme.preference) + 1) % order.length]!)
}

const query = ref('')
const tabs: TabItem[] = [
  { key: 'search', to: { name: 'home' } },
  { key: 'favorites' },
  { key: 'create', to: { name: 'createBarter' } },
  { key: 'exchanges', dot: true },
  { key: 'profile' },
]

function notReady(): void {
  showToast('В витрине кнопка ничего не делает', { kind: 'info' })
}
</script>

<template>
  <AppShell>
    <template #header>
      <AppHeader
        v-model:query="query"
        messages
        location="Москва · 10 км"
        currency="₽ RUB"
        :language="LOCALE_NAMES[localeModel]"
        :theme-name="t(`theme.${theme.preference}`)"
        :user="{ name: 'Анна Ковалёва', seed: 'PMockUser1', balance: 842.5 }"
        :unread="3"
        @theme="cycleTheme"
        @search="notReady"
        @create="notReady"
      />
    </template>
    <template #mobile-top>
      <MobileTopBar
        placeholder="Поиск в Москве"
        filters-active
        @search="notReady"
        @filters="notReady"
      >
        <UiChip removable :size="32" remove-label="Убрать гео-фильтр">До 10 км</UiChip>
        <UiChip :size="32">Бесплатно</UiChip>
        <UiChip :size="32">С обменом</UiChip>
        <UiChip :size="32">Безопасная сделка</UiChip>
      </MobileTopBar>
    </template>

    <div class="container showcase" data-testid="showcase">
      <header class="showcase__head">
        <div class="showcase__titles">
          <span class="showcase__kicker">Дизайн-система · витрина</span>
          <h1 class="showcase__title">Barteron nextgen</h1>
          <p class="showcase__lead">
            Компоненты из <code>src/ui</code> и <code>src/components</code> по листам прототипа
            foundations, components и marketplace.
          </p>
        </div>
        <div class="showcase__controls">
          <UiSegmented
            v-model="themeModel"
            :items="themeItems"
            label="Тема"
            data-testid="theme-switch"
          />
          <UiSelect v-model="localeModel" :options="localeOptions" label="Язык" />
        </div>
      </header>

      <UiSegmented v-model="sheet" class="showcase__tabs" :items="SHEETS" label="Лист" />

      <SheetFoundations v-if="sheet === 'foundations'" />
      <SheetComponents v-else-if="sheet === 'components'" />
      <SheetMarketplace v-else-if="sheet === 'marketplace'" />
      <SheetData v-else />
    </div>

    <template #tabbar>
      <TabBar :items="tabs" active="search" />
    </template>
  </AppShell>
</template>

<style scoped>
.showcase {
  padding-top: 32px;
  padding-bottom: 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.showcase__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px 32px;
}

.showcase__titles {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.showcase__kicker {
  font-size: 14px;
  font-weight: 700;
  color: var(--link);
}

.showcase__title {
  font-size: 40px;
  line-height: 48px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.showcase__lead {
  font-size: 16px;
  line-height: 24px;
  color: var(--text2);
}

.showcase__lead code {
  font-family: var(--font-mono);
  font-size: 14px;
}

.showcase__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.showcase__controls > :first-child {
  min-width: 320px;
}

.showcase__controls > :last-child {
  width: 160px;
}

.showcase__tabs {
  max-width: 720px;
}

@media (max-width: 767px) {
  .showcase {
    padding-top: 20px;
    gap: 16px;
  }

  /* Four sheet names do not fit one row at 390 px. */
  .showcase__tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .showcase__title {
    font-size: 28px;
    line-height: 36px;
  }

  .showcase__controls,
  .showcase__controls > :first-child {
    width: 100%;
    min-width: 0;
  }
}
</style>
