<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currenciesFor } from '@/api/rates'
import { useMyAccount } from '@/composables/my-account'
import { usePlaceName } from '@/composables/place-name'
import { useCurrencyStore } from '@/stores/currency'
import { LOCALE_CHOICES, useLocaleStore, type LocaleChoice } from '@/stores/locale'
import { useThemeStore, type ThemePreference } from '@/stores/theme'
import { useUiStore } from '@/stores/ui'
import UiIcon from '@/ui/UiIcon.vue'
import UiSegmented from '@/ui/UiSegmented.vue'
import UiSelect from '@/ui/UiSelect.vue'
import MyListCard from './MyListCard.vue'
import SectionHead from './SectionHead.vue'
import SettingsMenu from './SettingsMenu.vue'

const HomePlaceDialog = defineAsyncComponent(() => import('./HomePlaceDialog.vue'))

/**
 * «Настройки» (s5-settings-desktop): «Мой список обмена» and the place for
 * new offers go to my Barteron profile; theme, language and currency stay on
 * the device (the old keys, as in the header). On a phone the section is
 * «Настройки и помощь» (s8-menu-mobile): rows that open sheets, and the place
 * for new offers under them; «Мой список обмена» has its own row in the
 * phone cabinet.
 */
const { t, locale } = useI18n()
const account = useMyAccount()
const theme = useThemeStore()
const localeStore = useLocaleStore()
const currency = useCurrencyStore()
const ui = useUiStore()

const themes = computed(() =>
  (['system', 'light', 'dark'] as const).map((value) => ({
    value,
    label: t(`theme.option.${value}`),
  }))
)
const themeModel = computed<ThemePreference>({
  get: () => theme.preference,
  set: (value) => theme.setPreference(value),
})

const languages = computed(() =>
  LOCALE_CHOICES.map((choice) => ({ value: choice, label: t(`language.${choice}`) }))
)
const languageModel = computed<LocaleChoice>({
  get: () => localeStore.choice,
  set: (value) => localeStore.set(value),
})

const currencyNames = computed(() => {
  try {
    return new Intl.DisplayNames([locale.value], { type: 'currency' })
  } catch {
    return null
  }
})
/** «российский рубль» → «Российский рубль». */
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase(locale.value) + s.slice(1)
const currencies = computed(() => [
  ...currenciesFor(localeStore.effective).map((c) => ({
    value: c.code,
    label: `${c.symbol} ${capitalize(currencyNames.value?.of(c.code) ?? c.code)}`,
  })),
  { value: 'PKOIN', label: t('currency.pkoinOnly') },
])
const currencyModel = computed<string>({
  get: () => (currency.pkoinOnly ? 'PKOIN' : currency.code),
  set: (value) => (value === 'PKOIN' ? currency.setPkoinOnly() : currency.set(value)),
})

// ─── Place for new offers: my profile's `g` and `s` ─────────────────────────
const shown = computed(() => account.shown.value)
const fixed = computed(() => !!shown.value?.static && !!shown.value.geohash)
const placeName = usePlaceName(() => (fixed.value ? shown.value?.geohash : ''))
const placeOpen = ref(false)
const placeLocked = computed(() => account.pending.value || !account.canSave.value)
const placeModes = computed(() => [
  { value: 'fixed' as const, label: t('settings.place.fixed') },
  { value: 'geo' as const, label: t('settings.place.geo') },
])
const placeMode = computed<'fixed' | 'geo'>({
  get: () => (fixed.value ? 'fixed' : 'geo'),
  set: (value) => {
    if (value === 'fixed') placeOpen.value = true
    else if (fixed.value) account.save((a) => ({ ...a, static: false, geohash: '' }))
  },
})
function savePlace(geohash: string) {
  account.save((a) => ({ ...a, static: true, geohash }))
}
const placeText = computed(() => {
  if (!fixed.value) return t('settings.place.geoHint')
  return placeName.data.value ?? t('settings.place.pointSet')
})

const version = __APP_VERSION__
</script>

<template>
  <section class="set" data-testid="cabinet-settings">
    <SectionHead :title="t('cabinet.sections.settings')" />

    <SettingsMenu class="set__phone" />

    <div class="set__card set__desktop">
      <MyListCard :account="account" />
    </div>

    <div class="set__card set__rows">
      <div class="set__desktop">
        <div class="set__row">
          <span class="set__label">{{ t('theme.title') }}</span>
          <UiSegmented
            v-model="themeModel"
            class="set__seg"
            :items="themes"
            :label="t('theme.title')"
          />
        </div>
        <div class="set__row">
          <span class="set__label">{{ t('language.title') }}</span>
          <UiSelect
            v-model="languageModel"
            class="set__select"
            :options="languages"
            :label="t('language.title')"
          />
        </div>
        <div class="set__row">
          <span class="set__label">
            {{ t('settings.currency') }}
            <span class="set__sub">{{ t('settings.currencyHint') }}</span>
          </span>
          <UiSelect
            v-model="currencyModel"
            class="set__select"
            :options="currencies"
            :label="t('settings.currency')"
          />
        </div>
      </div>
      <div class="set__row" data-testid="settings-place">
        <span class="set__label">
          {{ t('settings.place.title') }}
          <span class="set__sub">
            {{ placeText }}
            <button
              v-if="fixed && !placeLocked"
              type="button"
              class="set__inline"
              data-testid="settings-place-change"
              @click="placeOpen = true"
            >
              {{ t('settings.place.change') }}
            </button>
          </span>
        </span>
        <UiSegmented
          v-model="placeMode"
          class="set__seg set__seg--place"
          :items="placeModes"
          :label="t('settings.place.title')"
          :disabled="placeLocked"
        />
      </div>
      <p v-if="account.pending.value" class="set__pending">{{ t('account.locked') }}</p>
    </div>

    <div class="set__card set__links set__desktop">
      <RouterLink class="set__link" :to="{ name: 'tips' }" data-testid="settings-tips">
        {{ t('settings.links.tips') }}
      </RouterLink>
      <button type="button" class="set__link" @click="ui.openSafeDealHelp()">
        {{ t('settings.links.safeDeal') }}
      </button>
      <button
        type="button"
        class="set__link"
        data-testid="settings-support"
        @click="ui.openDialog('support')"
      >
        {{ t('settings.links.support')
        }}<span class="set__meta">{{ t('settings.links.supportMeta') }}</span>
      </button>
      <button
        type="button"
        class="set__link"
        data-testid="settings-survey"
        @click="ui.openDialog('survey')"
      >
        {{ t('settings.links.survey') }}
      </button>
      <RouterLink class="set__link" :to="{ name: 'about' }">{{ t('info.about') }}</RouterLink>
      <button type="button" class="set__link" @click="ui.openDialog('legal')">
        {{ t('legal.title') }}<UiIcon name="chevron-right" :size="16" class="set__meta" />
      </button>
      <span class="set__version">{{ t('settings.version', { version }) }}</span>
    </div>
    <p class="set__phone set__foot">
      {{ t('settings.menu.foot') }}<br />{{ t('settings.menu.device') }}<br />{{
        t('settings.menu.version', { version })
      }}
    </p>

    <HomePlaceDialog
      v-if="placeOpen"
      v-model:open="placeOpen"
      :geohash="shown?.geohash ?? ''"
      @save="savePlace"
    />
  </section>
</template>

<style scoped>
.set {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.set__card {
  padding: 24px;
  border-radius: 20px;
  background: var(--surface);
}

.set__rows,
.set__links {
  padding-top: 8px;
  padding-bottom: 8px;
}

.set__row {
  min-height: 72px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}

.set__row:first-child {
  border-top: 0;
}

.set__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 15px;
  line-height: 20px;
  font-weight: 600;
}

.set__sub {
  font-size: 13px;
  line-height: 18px;
  font-weight: 400;
  color: var(--text2);
}

.set__inline {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--link);
  font: inherit;
  cursor: pointer;
}

.set__seg {
  min-width: 270px;
}

.set__select {
  width: 220px;
}

.set__pending {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--warning);
}

.set__link {
  width: 100%;
  min-height: 56px;
  padding: 0;
  border: 0;
  border-top: 1px solid var(--border);
  background: none;
  color: var(--text);
  font: 400 15px / 20px var(--font-sans);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.set__link:first-child {
  border-top: 0;
}

.set__link:hover {
  color: var(--link);
  text-decoration: none;
}

.set__phone {
  display: none;
}

.set__foot {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--text3);
  text-align: center;
}
.set__meta {
  font-size: 13px;
  color: var(--text3);
}

.set__version {
  display: block;
  padding: 16px 0 8px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text3);
}

.set__link:focus-visible,
.set__inline:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
  border-radius: 6px;
}

@media (max-width: 767px) {
  .set__desktop {
    display: none;
  }

  .set__phone {
    display: flex;
  }

  .set__foot {
    display: block;
  }

  /* Only the place for new offers is left in this card: no line over it. */
  .set__rows .set__row[data-testid='settings-place'] {
    border-top: 0;
  }

  .set__card {
    padding: 18px;
  }

  .set__rows,
  .set__links {
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .set__seg,
  .set__select {
    width: 100%;
    min-width: 0;
  }
}
</style>
