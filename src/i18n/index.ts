import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ru, { type Messages } from './locales/ru'
import sr from './locales/sr'

export const LOCALES = ['ru', 'en', 'sr'] as const
export type Locale = (typeof LOCALES)[number]

/** Same fallback as the old app (en-US). */
export const FALLBACK_LOCALE: Locale = 'en'

/** Maps a host or browser locale (`ru`, `ru-RU`, `sr_RS`) to a supported one. */
export function resolveLocale(value: string | null | undefined): Locale {
  const lang = (value ?? '').toLowerCase().split(/[-_]/)[0] ?? ''
  return (LOCALES as readonly string[]).includes(lang) ? (lang as Locale) : FALLBACK_LOCALE
}

export const i18n = createI18n<[Messages], Locale, false>({
  legacy: false,
  locale: resolveLocale(typeof navigator === 'undefined' ? null : navigator.language),
  fallbackLocale: FALLBACK_LOCALE,
  messages: { ru, en, sr },
})

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}
