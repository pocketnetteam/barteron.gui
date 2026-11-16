import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw, ref } from 'vue'
import { i18n, setLocale } from '@/i18n'
import type { CatalogRequest } from '@/models/filters'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { demoNetworkData } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import { useSessionStore } from '@/stores/session'
import { useCatalogList } from './catalog-list'

/** `failFeed(n)` — the n-th feed request fails (1 — the first page). */
function setup(failFeed: number[] = []) {
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const network = createMockNetwork(demoNetworkData(MOCK_ADDRESS))
  let feedCalls = 0
  const sdk = createMockSdk({
    network,
    rpc: {
      getbarteronfeed: (parameters) => {
        feedCalls += 1
        if (failFeed.includes(feedCalls)) throw new Error('timeout')
        return network.rpc.getbarteronfeed!(parameters)
      },
    },
  })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  const request = ref<CatalogRequest | null>(null)
  const failed = ref<unknown>(null)
  const retryPrepare = vi.fn()
  let list!: ReturnType<typeof useCatalogList>
  const wrapper = mount(
    defineComponent({
      setup() {
        list = useCatalogList(request, null, { failed, retryPrepare })
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
  return { list, request, failed, retryPrepare, wrapper }
}

describe('a catalog list waiting for its request', () => {
  it('categories still loading: «загружаем», not «ничего не найдено»', () => {
    const { list, wrapper } = setup()
    expect(list.loading.value).toBe(true)
    expect(list.error.value).toBeNull()
    expect(list.offers.value).toEqual([])
    wrapper.unmount()
  })

  it('categories failed: an error whose retry loads them again', async () => {
    const { list, failed, retryPrepare, wrapper } = setup()
    failed.value = new Error('chunk')
    expect(list.loading.value).toBe(false)
    expect(list.error.value).toBe(failed.value)
    list.retry()
    expect(retryPrepare).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('the request ready: its offers', async () => {
    const { list, request, wrapper } = setup()
    request.value = { kind: 'feed', request: { orderBy: 'height', orderDesc: true, pageSize: 12 } }
    await vi.waitFor(() => expect(list.offers.value.length).toBeGreaterThan(0))
    expect(list.loading.value).toBe(false)
    wrapper.unmount()
  })

  it('the first page failing: an error, nothing to show', async () => {
    const { list, request, wrapper } = setup([1])
    request.value = { kind: 'feed', request: { orderBy: 'height', orderDesc: true, pageSize: 4 } }
    await vi.waitFor(() => expect(list.error.value).toBeTruthy())
    expect(list.loading.value).toBe(false)
    expect(list.offers.value).toEqual([])
    wrapper.unmount()
  })

  it('a later page failing: what came stays, the error is for «ещё»', async () => {
    const { list, request, wrapper } = setup([2])
    request.value = { kind: 'feed', request: { orderBy: 'height', orderDesc: true, pageSize: 4 } }
    await vi.waitFor(() => expect(list.offers.value.length).toBeGreaterThan(0))
    const shown = list.offers.value.length
    expect(list.hasMore.value).toBe(true)
    list.more()
    await vi.waitFor(() => expect(list.moreError.value).toBeTruthy())
    expect(list.error.value).toBeNull()
    expect(list.offers.value).toHaveLength(shown)
    // «Повторить» asks for the next page again.
    list.more()
    await vi.waitFor(() => expect(list.offers.value.length).toBeGreaterThan(shown))
    expect(list.moreError.value).toBeNull()
    wrapper.unmount()
  })
})
