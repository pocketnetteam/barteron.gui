import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { setLocale } from '@/i18n'
import { removeStored } from '@/lib/storage'
import { PAYMENT_WAIT_MS } from '@/models/safe-deal'
import type { Offer } from '@/models/offer'
import { demoDeals } from '@/sdk/mock-data'
import { blockStorage } from '@/test/storage'
import { RENEW_SNOOZE_MS, useAutorenewStore } from './autorenew'
import { useCurrencyStore } from './currency'
import { useDealsStore } from './deals'
import { useFavoritesStore } from './favorites'
import { useLocationStore } from './location'
import { useSessionStore } from './session'
import { useThemeStore } from './theme'

/** Stage 25: what the device keeps, across tabs, accounts and the old version. */
const ME = 'PMockUser1111111111111111111111111'
const OTHER = 'PDemoMariaV11111111111111111111111'

/** Another tab of the app writes the key: the browser tells this one through `storage`. */
function otherTab(key: string, value: string | null) {
  if (value === null) localStorage.removeItem(key)
  else localStorage.setItem(key, value)
  window.dispatchEvent(new StorageEvent('storage', { key }))
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  void setLocale('ru')
})

describe('two tabs of the app', () => {
  it('favourites: a heart in one tab is not lost by a heart in the other', async () => {
    useSessionStore().address = ME
    const favorites = useFavoritesStore()
    await nextTick()
    favorites.toggle('a')
    otherTab(`${ME}_like`, JSON.stringify(['a', 'b']))
    expect(favorites.ids).toEqual(['a', 'b'])
    favorites.toggle('c')
    expect(JSON.parse(localStorage.getItem(`${ME}_like`)!)).toEqual(['a', 'b', 'c'])
  })

  it('«Сделки»: a deal opened in the other tab stays in the list', async () => {
    const [first, second, third] = demoDeals(ME, 1_000_000).deals
    useSessionStore().address = ME
    const deals = useDealsStore()
    await nextTick()
    deals.remember(first!, 1)
    otherTab(
      `${ME}_deals`,
      JSON.stringify([
        { ...second, savedAt: 2 },
        { ...first, savedAt: 1 },
      ])
    )
    deals.remember(third!, 3)
    expect(deals.list.map((d) => d.id)).toEqual([third!.id, second!.id, first!.id])
  })

  it('currency, place and theme follow the other tab', async () => {
    useSessionStore().address = ME
    const currency = useCurrencyStore()
    const location = useLocationStore()
    const theme = useThemeStore()
    await nextTick()
    otherTab(`${ME}_currency`, '"EUR"')
    otherTab(`${ME}_location`, JSON.stringify({ geohash: 'ucfv0', zoom: 10, bounds: null }))
    otherTab('barteron.theme', 'dark')
    expect(currency.code).toBe('EUR')
    expect(location.stored.geohash).toBe('ucfv0')
    expect(theme.preference).toBe('dark')
    // «Очистить данные сайта» in the other tab: back to the defaults.
    localStorage.clear()
    window.dispatchEvent(new StorageEvent('storage', { key: null }))
    expect(currency.chosen).toBeNull()
    expect(location.stored.geohash).toBeNull()
    expect(theme.preference).toBe('system')
  })

  it('a store let go stops listening to the other tab', async () => {
    useSessionStore().address = ME
    const favorites = useFavoritesStore()
    const theme = useThemeStore()
    await nextTick()
    favorites.$dispose()
    theme.$dispose()
    otherTab(`${ME}_like`, JSON.stringify(['b']))
    otherTab('barteron.theme', 'dark')
    expect(favorites.ids).toEqual([])
    expect(theme.preference).toBe('system')
  })

  it('another account’s keys change nothing here', async () => {
    useSessionStore().address = ME
    const favorites = useFavoritesStore()
    await nextTick()
    favorites.toggle('mine')
    otherTab(`${OTHER}_like`, JSON.stringify(['theirs']))
    expect(favorites.ids).toEqual(['mine'])
  })
})

describe('the old app’s values', () => {
  it.each([
    ['"light"', 'light'],
    ['"dark"', 'dark'],
    // The navy theme is gone: it was a dark one.
    ['"navy"', 'dark'],
    ['"inherit"', 'system'],
    ['{oops', 'system'],
  ])('theme %s chosen in the old app carries over as %s', async (raw, preference) => {
    localStorage.setItem(`${ME}_theme`, raw)
    const theme = useThemeStore()
    expect(theme.preference).toBe('system')
    useSessionStore().address = ME
    await nextTick()
    expect(theme.preference).toBe(preference)
    // Kept under the new key: the next start shows it before the address is known.
    expect(localStorage.getItem('barteron.theme')).toBe(preference === 'system' ? null : preference)
  })

  it('a currency this version does not offer gives the default for the language', async () => {
    localStorage.setItem(`${ME}_currency`, '"RSD"')
    useSessionStore().address = ME
    const currency = useCurrencyStore()
    await nextTick()
    expect(currency.chosen).toBeNull()
    expect(currency.code).toBe('RUB')
  })

  it('a theme chosen in this version wins over the old one', async () => {
    localStorage.setItem('barteron.theme', 'system')
    localStorage.setItem(`${ME}_theme`, '"dark"')
    const theme = useThemeStore()
    useSessionStore().address = ME
    await nextTick()
    expect(theme.preference).toBe('system')
  })
})

describe('what grows', () => {
  it('a transfer record older than the wait is dropped on the next write', async () => {
    useSessionStore().address = ME
    const deals = useDealsStore()
    await nextTick()
    deals.markSent('old', '1', 'tx1', 1_000)
    deals.markSent('fresh', '1', 'tx2', 2_000)
    // Exactly the wait later: «ждём блок» is over for the first, as `sentAt` says.
    deals.markSent('new', '1', 'tx3', 1_000 + PAYMENT_WAIT_MS)
    expect(deals.sentAt('old', '1', 1_000 + PAYMENT_WAIT_MS)).toBeNull()
    const kept = JSON.parse(localStorage.getItem(`${ME}_safeDeal`)!)
    expect(Object.keys(kept)).toEqual(['fresh', 'new'])
    expect(deals.sentAt('new', '1', 1_000 + PAYMENT_WAIT_MS + 2)?.transaction).toBe('tx3')
  })
})

describe('values that cannot be right', () => {
  it('«Не сейчас» stamped by a clock years ahead does not silence renewal for good', async () => {
    const now = Date.UTC(2026, 10, 14)
    localStorage.setItem(`${ME}_autorenew_snooze`, String(now + 10 * 365 * 86_400_000))
    useSessionStore().address = ME
    const autorenew = useAutorenewStore()
    await nextTick()
    const offer = { hash: 'a'.repeat(64), published: 'published', till: now + 86_400_000 } as Offer
    expect(autorenew.due([offer], now)).toEqual([offer])
    // A real «Не сейчас» still puts it off for a day.
    autorenew.snooze(now)
    expect(autorenew.due([offer], now)).toEqual([])
    expect(autorenew.due([offer], now + RENEW_SNOOZE_MS - 1)).toEqual([])
    expect(autorenew.due([offer], now + RENEW_SNOOZE_MS)).toEqual([offer])
  })
})

describe('storage the browser refuses', () => {
  afterEach(() => removeStored(`${ME}_like`))

  it('the app starts and favourites work until restart', async () => {
    const restore = blockStorage()
    try {
      setActivePinia(createPinia())
      useSessionStore().address = ME
      const favorites = useFavoritesStore()
      const theme = useThemeStore()
      await nextTick()
      favorites.toggle('a')
      theme.setPreference('dark')
      expect(favorites.ids).toEqual(['a'])
      expect(theme.theme).toBe('dark')
      // Another page of this visit, another store instance: still there.
      setActivePinia(createPinia())
      useSessionStore().address = ME
      await nextTick()
      expect(useFavoritesStore().ids).toEqual(['a'])
    } finally {
      restore()
    }
  })
})
