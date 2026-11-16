import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { i18n, setLocale } from '@/i18n'
import { createAppRouter } from '@/router'
import { createMockSdk, MOCK_ADDRESS, type MockOptions } from '@/sdk/mock'
import { demoNetworkData } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import { toasts } from '@/ui/toast'
import { useChat } from './chat'

const SELLER = 'PSeller'.padEnd(34, '1')

async function setup(options: Pick<MockOptions, 'granted' | 'grantOnRequest'> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const sdk = createMockSdk({
    network: createMockNetwork(demoNetworkData(MOCK_ADDRESS)),
    ...options,
  })
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

  it('the host refuses the room: said in words, nothing sent, and it can be tried again', async () => {
    const { chat, calls, wrapper } = await setup()
    const sdk = useSessionStore().sdk!
    const real = sdk.chat.getOrCreateRoom.bind(sdk.chat)
    sdk.chat.getOrCreateRoom = async () => {
      throw new Error('chat:unavailable')
    }
    const before = toasts.items.length
    expect(await chat.open({ members: [SELLER], messages: ['Хочу купить'] })).toBe(false)
    expect(calls('chat.send')).toHaveLength(0)
    expect(chat.opening.value).toBe(false)
    // The progress toast went, the error stayed.
    expect(toasts.items.slice(before).map((t) => [t.kind, t.text])).toEqual([
      ['error', 'Не удалось открыть чат. Попробуйте ещё раз'],
    ])
    // A room without an id is a refusal too.
    sdk.chat.getOrCreateRoom = async () => ({})
    expect(await chat.open({ members: [SELLER], messages: [] })).toBe(false)
    sdk.chat.getOrCreateRoom = real
    expect(await chat.open({ members: [SELLER], messages: ['Хочу купить'] })).toBe(true)
    expect(calls('chat.send')).toHaveLength(1)
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

  it('chats not allowed and the user says no: how to allow them, not «чат не открылся»', async () => {
    // Both hosts reject the request when the user refuses (`permission:denied:chat`).
    const { chat, calls } = await setup({ granted: ['account'], grantOnRequest: false })
    expect(await chat.open({ members: [SELLER], messages: ['Здравствуйте'] })).toBe(false)
    expect(calls('permissions.request').map((c) => c.args[0])).toEqual([['chat']])
    expect(useUiStore().dialog).toBe('permissions')
    expect(toasts.items.filter((t) => t.kind === 'error')).toEqual([])
    expect(calls('chat.getOrCreateRoom')).toHaveLength(0)
    expect(chat.opening.value).toBe(false)
  })
})
