// Tests switch languages synchronously: all three are registered up front.
import { registerLocale } from '@/i18n'
import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'
import sr from '@/i18n/locales/sr'

registerLocale('ru', ru)
registerLocale('en', en)
registerLocale('sr', sr)
