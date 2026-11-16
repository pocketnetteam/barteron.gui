import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { createMockSdk, MOCK_ADDRESS, type MockRpcHandler } from '@/sdk/mock'
import { useSessionStore } from '@/stores/session'
import { useCabinetHead } from './cabinet-data'

async function setup(accounts: MockRpcHandler, balanceRefused = false) {
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const sdk = createMockSdk({ rpc: { getbarteronaccounts: accounts, getuserprofile: () => [] } })
  if (balanceRefused) {
    sdk.get.balance = async () => {
      throw new Error('not_authenticated')
    }
  }
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let head!: ReturnType<typeof useCabinetHead>
  const wrapper = mount(
    defineComponent({
      setup() {
        head = useCabinetHead()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, [VueQueryPlugin, { queryClient: client }]] } }
  )
  return { head, wrapper }
}

describe('the cabinet head', () => {
  it('«Нет оценок» only once my profile came without scores: not while loading, not when it failed', async () => {
    let answer: ((v: unknown) => void) | null = null
    const loading = await setup(() => new Promise((resolve) => (answer = resolve)))
    // The accounts go in one batch a moment later.
    await vi.waitFor(() => expect(answer).not.toBeNull())
    expect(loading.head.rating.value).toBe('')
    answer!([])
    await vi.waitFor(() => expect(loading.head.rating.value).toBe('Нет оценок'))
    loading.wrapper.unmount()

    const failed = await setup(() => {
      throw new Error('timeout')
    })
    await vi.waitFor(() => expect(failed.head.account.isError.value).toBe(true))
    expect(failed.head.rating.value).toBe('')
    failed.wrapper.unmount()
  })

  it('the balance: what the host says, and no number at all when it refuses', async () => {
    const ok = await setup(() => [])
    await vi.waitFor(() => expect(ok.head.pkoin.value).toBe('842,5 PKOIN'))
    ok.wrapper.unmount()

    const refused = await setup(() => [], true)
    await vi.waitFor(() => expect(refused.head.balance.isError.value).toBe(true))
    // The wallet then says «Баланс не получен», not «0 PKOIN».
    expect(refused.head.pkoin.value).toBeNull()
    expect(refused.head.equivalent.value).toBeNull()
    refused.wrapper.unmount()
  })
})
