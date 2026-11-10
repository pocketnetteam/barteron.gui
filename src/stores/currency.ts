import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { i18n } from '@/i18n'
import { CURRENCIES, defaultCurrency } from '@/api/rates'
import { readStored, userKey, writeStored } from '@/lib/storage'
import { useSessionStore } from './session'
import { useUserStored } from './stored'

/**
 * Currency for the equivalent next to PKOIN prices. Stored under the old
 * app's key (`<address>_currency`), so the choice carries over.
 */
export const useCurrencyStore = defineStore('currency', () => {
  const session = useSessionStore()
  const stored = ref('')

  watch(
    () => session.address,
    (address) => {
      const value = readStored<unknown>(userKey('currency', address), '')
      stored.value =
        typeof value === 'string' && CURRENCIES.some((c) => c.code === value) ? value : ''
    },
    { immediate: true }
  )

  /** The chosen currency, or the first one for the interface language. */
  const code = computed(() => stored.value || defaultCurrency(i18n.global.locale.value))

  /**
   * «Только PKOIN»: no equivalent next to prices. New in this version, so it
   * has its own key: the old app would not understand «PKOIN» as a currency.
   */
  const pkoinOnly = useUserStored<boolean>('pkoin_only', false, (v) => v === true)

  function set(value: string) {
    if (!CURRENCIES.some((c) => c.code === value)) return
    stored.value = value
    writeStored(userKey('currency', session.address), value)
    pkoinOnly.set(false)
  }

  return {
    code,
    chosen: computed(() => stored.value || null),
    pkoinOnly: pkoinOnly.value,
    /** Currency for the equivalent; `undefined` with «Только PKOIN». */
    shown: computed(() => (pkoinOnly.value.value ? undefined : code.value)),
    set,
    setPkoinOnly: () => pkoinOnly.set(true),
  }
})
