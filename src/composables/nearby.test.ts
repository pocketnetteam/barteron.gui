import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { loadCategoryTree } from '@/models/categories'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { demoNetworkData } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import { useLocationStore } from '@/stores/location'
import { useSessionStore } from '@/stores/session'
import { useNearby } from './nearby'

vi.mock('@/models/categories', async (original) => {
  const real = await original<typeof import('@/models/categories')>()
  return { ...real, loadCategoryTree: vi.fn(real.loadCategoryTree) }
})

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const sdk = createMockSdk({ network: createMockNetwork(demoNetworkData(MOCK_ADDRESS)) })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  useLocationStore().setArea({ center: [55.7522, 37.6156], radiusKm: 10 })
  let nearby!: ReturnType<typeof useNearby>
  const wrapper = mount(
    defineComponent({
      setup() {
        nearby = useNearby()
        return () => h('div')
      },
    }),
    {
      global: {
        plugins: [
          pinia,
          i18n,
          [
            VueQueryPlugin,
            { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
          ],
        ],
      },
    }
  )
  return { nearby, wrapper }
}

describe('«Что продают рядом» and the category tree', () => {
  it('the tree loaded: the summary of the area', async () => {
    const { nearby, wrapper } = setup()
    await vi.waitFor(() => expect(nearby.summary.value?.offers.length).toBeGreaterThan(0))
    expect(nearby.loading.value).toBe(false)
    expect(nearby.error.value).toBeNull()
    wrapper.unmount()
  })

  it('the tree failed: an error whose retry loads it again, not a skeleton forever', async () => {
    vi.mocked(loadCategoryTree).mockRejectedValueOnce(new Error('chunk'))
    const { nearby, wrapper } = setup()
    await vi.waitFor(() => expect(nearby.error.value).toBeTruthy())
    expect(nearby.loading.value).toBe(false)
    nearby.retry()
    await vi.waitFor(() => expect(nearby.summary.value?.offers.length).toBeGreaterThan(0))
    expect(nearby.error.value).toBeNull()
    wrapper.unmount()
  })
})
