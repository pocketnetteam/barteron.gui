import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, markRaw } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { banListLoaded, hangIfBanned, isBanned, loadBanList } from '@/config/ban'
import { i18n, setLocale } from '@/i18n'
import { createAppRouter } from '@/router'
import { createMockSdk, MOCK_ADDRESS } from '@/sdk/mock'
import { demoNetworkData } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import type { MockSurvey } from '@/sdk/mock-survey'
import { useSessionStore } from '@/stores/session'
import { useChat } from './chat'
import { surveyServiceFor, useSurvey } from './survey'

/**
 * The ban before its list has come. The list chunk is held back here until
 * `list.release()`, so the tests below run in order: first before the list,
 * then after it.
 */
const list = vi.hoisted(() => {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  return { gate, release: () => release(), banned: 'PBanned'.padEnd(34, '1') }
})
vi.mock('@/config/ban-list', async () => {
  await list.gate
  return { BAN_LIST: [list.banned] }
})

const BANNED = list.banned

/** Settles within `ms`, or not. The mock survey answers in 300 ms. */
async function settles(promise: Promise<unknown>, ms = 20): Promise<boolean> {
  let done = false
  void promise.then(() => (done = true))
  await new Promise((r) => setTimeout(r, ms))
  return done
}

async function setup<T>(address: string, use: () => T) {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  // `address` is a Bastyon user with a profile: the chat does not ask to activate.
  const sdk = createMockSdk({ network: createMockNetwork(demoNetworkData(address)) })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.appinfo = await sdk.get.appinfo()
  session.account = 'signed-in'
  session.address = address
  // The mock one: what it «sent» is kept.
  const survey = surveyServiceFor(sdk, 'mock') as MockSurvey
  // Counted by hand: `restoreMocks` would take a spy off between the tests below.
  const asked: string[] = []
  const status = survey.status.bind(survey)
  survey.status = (who) => {
    asked.push(who)
    return status(who)
  }
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result!: T
  mount(
    defineComponent({
      setup() {
        result = use()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] } }
  )
  await flushPromises()
  const calls = (method: string) => sdk.mock.calls.filter((c) => c.method === method)
  return { result, survey, asked, calls }
}

beforeAll(() => {
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no network in tests')))
})
afterAll(() => {
  vi.unstubAllGlobals()
})

describe('before the ban list has come', () => {
  const bannedNow = computed(() => isBanned(BANNED))
  let pending: {
    survey: Awaited<ReturnType<typeof setup<ReturnType<typeof useSurvey>>>>
    chat: Promise<boolean>
    chatCalls: () => number
    hang: Promise<void>
  }

  it('nobody looks banned yet, so nothing that needs the list goes ahead', async () => {
    expect(banListLoaded()).toBe(false)
    expect(bannedNow.value).toBe(false)

    // The survey: not even its status is asked for.
    const survey = await setup(BANNED, () => useSurvey())
    expect(survey.asked).toEqual([])

    // The chat waits for the list.
    const chat = await setup(BANNED, () => useChat())
    const opening = chat.result.open({ members: [MOCK_ADDRESS], messages: [] })
    expect(await settles(opening)).toBe(false)

    const hang = hangIfBanned(BANNED)
    expect(await settles(hang)).toBe(false)
    pending = {
      survey,
      chat: opening,
      chatCalls: () => chat.calls('chat.getOrCreateRoom').length,
      hang,
    }
  })

  it('then the list comes: a `computed` asks again; the banned user gets nothing', async () => {
    list.release()
    await loadBanList()
    expect(banListLoaded()).toBe(true)
    expect(bannedNow.value).toBe(true)

    expect(await pending.chat).toBe(false)
    expect(pending.chatCalls()).toBe(0)
    expect(await settles(pending.hang)).toBe(false)

    await flushPromises()
    expect(pending.survey.asked).toEqual([])
    // Sending by hand hangs, like the old `setSurveyData`.
    const answers = { answer1: 'Да', answer2: 'Нет', email: '' }
    expect(await settles(pending.survey.result.send(answers), 400)).toBe(false)
    expect(pending.survey.survey.sent).toEqual([])
  })

  it('anyone else: the survey is asked once the list is here, the chat opens', async () => {
    const survey = await setup(MOCK_ADDRESS, () => useSurvey())
    await vi.waitFor(() => expect(survey.asked).toEqual([MOCK_ADDRESS]))
    expect(await settles(hangIfBanned(MOCK_ADDRESS))).toBe(true)
    const chat = await setup(MOCK_ADDRESS, () => useChat())
    expect(await chat.result.open({ members: [BANNED], messages: [] })).toBe(true)
    expect(chat.calls('chat.getOrCreateRoom')).toHaveLength(1)
  })
})
