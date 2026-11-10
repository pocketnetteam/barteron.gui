import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { resolveLocale, setLocale, type Locale } from '@/i18n'
import { useSessionStore } from './session'
import { useUserStored } from './stored'

/** Values of the old `<address>_locale` key: `inherit` follows Bastyon. */
export const LOCALE_CHOICES = ['inherit', 'ru-RU', 'en-US', 'sr-RS'] as const
export type LocaleChoice = (typeof LOCALE_CHOICES)[number]

const valid = (value: unknown): LocaleChoice =>
  (LOCALE_CHOICES as readonly unknown[]).includes(value) ? (value as LocaleChoice) : 'inherit'

/**
 * Interface language: Bastyon's unless the user picked one (the old language
 * switcher). The session applies the host language; this store puts the
 * user's choice on top whenever either changes.
 */
export const useLocaleStore = defineStore('locale', () => {
  const session = useSessionStore()
  const stored = useUserStored<LocaleChoice>('locale', 'inherit', valid)

  const effective = computed<Locale>(() =>
    resolveLocale(stored.value.value === 'inherit' ? session.hostLocale : stored.value.value)
  )

  watch([effective, () => session.hostLocale], () => setLocale(effective.value), {
    immediate: true,
  })

  return { choice: stored.value, effective, set: stored.set }
})
