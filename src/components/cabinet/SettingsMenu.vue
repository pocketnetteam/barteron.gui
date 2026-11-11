<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLocationLabel } from '@/components/layout/location-label'
import { useCurrencyStore } from '@/stores/currency'
import { useLocaleStore } from '@/stores/locale'
import { useThemeStore } from '@/stores/theme'
import { useUiStore, type AppDialog } from '@/stores/ui'
import type { IconName } from '@/ui/icons'
import UiIcon from '@/ui/UiIcon.vue'

/**
 * «Настройки и помощь» on a phone (s8-menu-mobile): how prices, language,
 * theme and the search area look, help, about Barteron. Each row opens a
 * sheet (s8-sheets-mobile), a window or a page.
 */
const { t } = useI18n()
const router = useRouter()
const ui = useUiStore()
const currency = useCurrencyStore()
const localeStore = useLocaleStore()
const theme = useThemeStore()
const locationLabel = useLocationLabel()

interface Row {
  key: string
  icon: IconName
  label: string
  value?: string
  run: () => void
}

const open = (name: AppDialog) => () => ui.openDialog(name)

const groups = computed<{ key: string; title: string; rows: Row[] }[]>(() => [
  {
    key: 'display',
    title: t('settings.menu.display'),
    rows: [
      {
        key: 'currency',
        icon: 'pkoin',
        label: t('currency.dialogTitle'),
        value: currency.pkoinOnly ? 'PKOIN' : currency.code,
        run: open('currency'),
      },
      {
        key: 'language',
        icon: 'globe',
        label: t('language.title'),
        value: t(
          `language.${localeStore.choice === 'inherit' ? localeStore.effective : localeStore.choice}`
        ),
        run: open('language'),
      },
      {
        key: 'theme',
        icon: 'moon',
        label: t('theme.title'),
        value: t(`theme.option.${theme.preference}`),
        run: open('theme'),
      },
      {
        key: 'area',
        icon: 'location',
        label: t('settings.menu.area'),
        value: locationLabel.value,
        run: () => ui.openLocation(),
      },
    ],
  },
  {
    key: 'help',
    title: t('settings.menu.help'),
    rows: [
      {
        key: 'tips',
        icon: 'tip',
        label: t('info.tips'),
        run: () => void router.push({ name: 'tips' }),
      },
      {
        key: 'safe',
        icon: 'safe-deal',
        label: t('settings.links.safeDeal'),
        run: () => ui.openSafeDealHelp(),
      },
      { key: 'support', icon: 'mail', label: t('support.title'), run: open('support') },
      { key: 'survey', icon: 'chat', label: t('footer.survey'), run: open('survey') },
    ],
  },
  {
    key: 'about',
    title: t('settings.menu.about'),
    rows: [
      {
        key: 'about',
        icon: 'info',
        label: t('info.about'),
        run: () => void router.push({ name: 'about' }),
      },
      { key: 'legal', icon: 'document', label: t('legal.title'), run: open('legal') },
    ],
  },
])
</script>

<template>
  <div class="smenu" data-testid="settings-menu">
    <section v-for="group in groups" :key="group.key" class="smenu__group">
      <h3 class="smenu__title">{{ group.title }}</h3>
      <ul class="smenu__card">
        <li v-for="row in group.rows" :key="row.key">
          <button type="button" class="smenu__row" :data-row="row.key" @click="row.run()">
            <UiIcon :name="row.icon" :size="22" :stroke="1.8" class="smenu__icon" />
            <span class="smenu__label">{{ row.label }}</span>
            <span v-if="row.value" class="smenu__value">{{ row.value }}</span>
            <UiIcon name="chevron-right" :size="18" :stroke="2" class="smenu__chevron" />
          </button>
        </li>
      </ul>
    </section>

    <button
      type="button"
      class="smenu__promo"
      data-row="referral"
      @click="ui.openDialog('referral')"
    >
      <strong>{{ t('referral.promo') }}</strong>
      <span>{{ t('referral.title') }}</span>
    </button>
  </div>
</template>

<style scoped>
.smenu {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.smenu__group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.smenu__title {
  margin: 0;
  padding: 0 8px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: var(--text2);
}

.smenu__card {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: 16px;
  background: var(--surface);
  overflow: hidden;
}

.smenu__card li + li {
  border-top: 1px solid var(--border);
}

.smenu__row {
  width: 100%;
  min-height: 54px;
  padding: 0 14px 0 16px;
  border: 0;
  background: none;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;
  font: 400 16px / 22px var(--font-sans);
  cursor: pointer;
}

.smenu__row:active {
  background: var(--subtle);
}

.smenu__row:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--ring);
}

.smenu__icon {
  flex: none;
  color: var(--text2);
}

.smenu__label {
  flex: 1;
  min-width: 0;
}

.smenu__value {
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  color: var(--text2);
}

.smenu__chevron {
  flex: none;
  color: var(--text3);
}

.smenu__promo {
  padding: 16px;
  border: 0;
  border-radius: 16px;
  background: var(--pkoin-soft);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  font: 400 13px / 18px var(--font-sans);
  cursor: pointer;
}

.smenu__promo strong {
  font-size: 15px;
  line-height: 20px;
  color: var(--pkoin);
}

.smenu__promo:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
