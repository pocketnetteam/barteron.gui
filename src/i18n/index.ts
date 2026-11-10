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

/**
 * Plural forms for Russian and Serbian: one / few / many, written in messages
 * as «{n} отзыв | {n} отзыва | {n} отзывов».
 */
export function slavicPlural(choice: number, choicesLength: number): number {
  const n = Math.abs(choice)
  if (choicesLength < 3) return n === 1 ? 0 : 1
  if (!Number.isInteger(n)) return 1
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 0
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 1
  return 2
}

export const i18n = createI18n<[Messages], Locale, false>({
  legacy: false,
  locale: resolveLocale(typeof navigator === 'undefined' ? null : navigator.language),
  fallbackLocale: FALLBACK_LOCALE,
  messages: { ru, en, sr },
  pluralRules: { ru: slavicPlural, sr: slavicPlural },
})

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}
