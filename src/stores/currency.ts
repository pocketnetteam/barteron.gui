import { defineStore } from 'pinia'
import { computed } from 'vue'
import { i18n } from '@/i18n'
import { CURRENCIES, defaultCurrency } from '@/api/rates'
import { useUserStored } from './stored'

const known = (value: unknown): string =>
  typeof value === 'string' && CURRENCIES.some((c) => c.code === value) ? value : ''

/**
 * Currency for the equivalent next to PKOIN prices. Stored under the old
 * app's key (`<address>_currency`), so the choice carries over.
 */
export const useCurrencyStore = defineStore('currency', () => {
  const stored = useUserStored('currency', '', known)

  /** The chosen currency, or the first one for the interface language. */
  const code = computed(() => stored.value.value || defaultCurrency(i18n.global.locale.value))

  /**
   * «Только PKOIN»: no equivalent next to prices. New in this version, so it
   * has its own key: the old app would not understand «PKOIN» as a currency.
   */
  const pkoinOnly = useUserStored<boolean>('pkoin_only', false, (v) => v === true)

  function set(value: string) {
    if (!known(value)) return
    stored.set(value)
    pkoinOnly.set(false)
  }

  return {
    code,
    chosen: computed(() => stored.value.value || null),
    pkoinOnly: pkoinOnly.value,
    /** Currency for the equivalent; `undefined` with «Только PKOIN». */
    shown: computed(() => (pkoinOnly.value.value ? undefined : code.value)),
    set,
    setPkoinOnly: () => pkoinOnly.set(true),
  }
})
