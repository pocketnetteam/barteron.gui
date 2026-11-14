import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { i18n, setLocale } from '@/i18n'
import { createAppRouter } from '@/router'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { demoNetworkData } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import { useSessionStore } from '@/stores/session'
import { useChat } from './chat'

const SELLER = 'PSeller'.padEnd(34, '1')

async function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const sdk = createMockSdk({ network: createMockNetwork(demoNetworkData(MOCK_ADDRESS)) })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.appinfo = await sdk.get.appinfo()
  session.account = 'signed-in'
  session.address = MOCK_ADDRESS
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let chat!: ReturnType<typeof useChat>
  const wrapper = mount(
    defineComponent({
      setup() {
        chat = useChat()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] } }
  )
  await flushPromises()
  const calls = (method: string) => sdk.mock.calls.filter((c) => c.method === method)
  return { chat, calls, wrapper }
}

beforeAll(() => {
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no network in tests')))
})
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('opening a chat', () => {
  it('two presses while the node is still asked about my profile: one room, one message', async () => {
    const { chat, calls, wrapper } = await setup()
    const request = { name: 'Велосипед', members: [SELLER], messages: ['Хочу купить'] }
    // The second press comes before the first has asked the node anything.
    const first = chat.open(request)
    expect(chat.opening.value).toBe(true)
    const second = chat.open(request)
    expect(await Promise.all([first, second])).toEqual([true, false])
    expect(calls('chat.getOrCreateRoom')).toHaveLength(1)
    expect(calls('chat.send')).toHaveLength(1)
    expect(chat.opening.value).toBe(false)
    wrapper.unmount()
  })

  it('not signed in: nothing opens, and the button is free again', async () => {
    const { chat, calls, wrapper } = await setup()
    const session = useSessionStore()
    session.ensureSignedIn = async () => false
    expect(await chat.open({ members: [SELLER], messages: [] })).toBe(false)
    expect(chat.opening.value).toBe(false)
    expect(calls('chat.getOrCreateRoom')).toHaveLength(0)
    // And it can be pressed again.
    session.ensureSignedIn = async () => true
    expect(await chat.open({ members: [SELLER], messages: [] })).toBe(true)
    wrapper.unmount()
  })
})
