import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { useCurrencyStore } from '@/stores/currency'
import { useSessionStore } from '@/stores/session'
import { mountUi } from '@/test/mount'
import RatesNotice from './RatesNotice.vue'

/** The notice with these rates already loaded and `code` chosen. */
function setup(rates: Record<string, number>, code: string | null = 'BYN') {
  const pinia = createPinia()
  setActivePinia(pinia)
  // Offline even if the rates were asked again: the mock has fixed ones.
  useSessionStore().mode = 'mock'
  const client = new QueryClient()
  client.setQueryData(['rates'], rates)
  const currency = useCurrencyStore()
  if (code) currency.set(code)
  else currency.setPkoinOnly()
  return mountUi(RatesNotice, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient: client }]] },
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('«Не получили курс»', () => {
  it('coingecko answered, the cross rate of the chosen currency did not (risk 10)', () => {
    const w = setup({ USD: 0.02, EUR: 0.018, RUB: 1.9 })
    expect(w.find('[data-testid="rates-notice"]').exists()).toBe(true)
    expect(w.text()).toContain('BYN')
  })

  it('the chosen currency has its rate: nothing to say', () => {
    expect(setup({ USD: 0.02, BYN: 0.064 }).find('[data-testid="rates-notice"]').exists()).toBe(
      false
    )
  })

  it('«Только PKOIN»: no equivalent is asked for', () => {
    expect(setup({ USD: 0.02 }, null).find('[data-testid="rates-notice"]').exists()).toBe(false)
  })
})
