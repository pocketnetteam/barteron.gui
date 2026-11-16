import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { offerFromAlias, type Offer } from '@/models/offer'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { toasts } from '@/ui/toast'
import { useOfferActions } from './offer-actions'

const HASH = 'cd'.repeat(32)
const myOffer = (patch: Record<string, unknown> = {}): Offer =>
  offerFromAlias(
    {
      hash: HASH,
      address: MOCK_ADDRESS,
      language: 'ru-RU',
      caption: 'Велосипед',
      description: 'Катался два сезона',
      tag: 1006,
      tags: [17],
      condition: 'used',
      images: ['https://img/1.jpg'],
      geohash: 'srywc8m3qz2k',
      price: 12000,
      time: 1_700_000_000,
      published: 'published',
      ...patch,
    },
    HASH
  )!

async function setup(offer: Offer) {
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const sdk = createMockSdk()
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.appinfo = await sdk.get.appinfo()
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let actions!: ReturnType<typeof useOfferActions>
  const wrapper = mount(
    defineComponent({
      setup() {
        actions = useOfferActions(() => offer)
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, [VueQueryPlugin, { queryClient: client }]] } }
  )
  await flushPromises()
  return { actions, tx: useTxStore(), wrapper }
}

describe('my offer: withdraw, renew', () => {
  it('an offer the node would refuse (no place): nothing goes, and the owner is told why', async () => {
    const { actions, tx, wrapper } = await setup(myOffer({ geohash: '' }))
    const before = toasts.items.length
    expect(actions.withdraw()).toBeNull()
    expect(actions.renew()).toBeNull()
    expect(tx.items).toEqual([])
    expect(toasts.items.slice(before).map((t) => [t.kind, t.text])).toEqual([
      [
        'error',
        'Объявление нельзя отправить: в нём не хватает данных. Откройте его на редактирование.',
      ],
      [
        'error',
        'Объявление нельзя отправить: в нём не хватает данных. Откройте его на редактирование.',
      ],
    ])
    wrapper.unmount()
  })

  it('a whole offer: withdrawing sends it again as «withdrawed»', async () => {
    const { actions, tx, wrapper } = await setup(myOffer())
    await actions.withdraw()
    expect(tx.items).toHaveLength(1)
    expect(tx.items[0]).toMatchObject({ kind: 'offer', target: HASH })
    expect((tx.items[0]!.payload as { published?: string }).published).toBe('withdrawed')
    wrapper.unmount()
  })
})
