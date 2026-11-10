import { createI18n } from 'vue-i18n'
import type { Messages } from './locales/ru'

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

/**
 * Texts load per language, in chunks of their own: a person needs one
 * language, and the three together were a third of the main bundle (about
 * 42 KB gzip). Every language has every key (`index.test.ts`), so the
 * fallback is not needed for texts.
 */
const LOADERS: Record<Locale, () => Promise<{ default: Messages }>> = {
  ru: () => import('./locales/ru'),
  en: () => import('./locales/en'),
  sr: () => import('./locales/sr'),
}

export const i18n = createI18n<[Messages], Locale, false>({
  legacy: false,
  locale: resolveLocale(typeof navigator === 'undefined' ? null : navigator.language),
  fallbackLocale: FALLBACK_LOCALE,
  messages: {} as Record<Locale, Messages>,
  pluralRules: { ru: slavicPlural, sr: slavicPlural },
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false,
})

const loaded = new Set<Locale>()

/** Texts already at hand (tests register all three at once). */
export function registerLocale(locale: Locale, messages: Messages): void {
  i18n.global.setLocaleMessage(locale, messages)
  loaded.add(locale)
}

async function loadLocale(locale: Locale): Promise<void> {
  if (loaded.has(locale)) return
  registerLocale(locale, (await LOADERS[locale]()).default)
}

function apply(locale: Locale) {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

let wanted: Locale | null = null

/**
 * Switches the language once its texts are here; until then the previous one
 * stays on screen. Immediate when they were loaded before.
 */
export function setLocale(locale: Locale): Promise<void> {
  wanted = locale
  if (loaded.has(locale)) {
    apply(locale)
    return Promise.resolve()
  }
  return loadLocale(locale).then(
    () => {
      if (wanted === locale) apply(locale)
    },
    // No chunk (offline after an update): the current language stays.
    () => undefined
  )
}
