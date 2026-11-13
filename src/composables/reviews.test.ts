import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw, ref } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { keys } from '@/api/queries'
import ReviewForm from '@/components/item/ReviewForm.vue'
import { i18n, setLocale } from '@/i18n'
import { emptyAccount, type BarteronAccount } from '@/models/account'
import { offerFromAlias, type Offer } from '@/models/offer'
import { TX_TYPE, type RawTx } from '@/models/tx'
import { createAppRouter } from '@/router'
import {
  createMockSdk,
  MOCK_ADDRESS,
  type MockOptions,
  type MockRpcHandler,
  type MockSdk,
} from '@/sdk/mock'
import { demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { createMockNetwork, type MockNetwork } from '@/sdk/mock-network'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { useOfferReviews } from './offer-reviews'
import { useProfileReviews } from './profile-reviews'
import { useScoreModeration } from './score-moderation'

/**
 * Reviews, scores and the moderation of low scores on the mock network
 * (`.env.test` turns the showcase on: the mock user and Илья are moderators,
 * Илья is on duty and let the mock user give the coffee machine a «2»).
 */
const ME = MOCK_ADDRESS
const txid = (label: string) =>
  Array.from(label)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .padEnd(64, 'a')
    .slice(0, 64)
const BIKE = txid('bike')
const COFFEE = txid('coffee')
const ODD = txid('odd-offer')
const offer = (hash: string, address: string): Offer =>
  offerFromAlias(
    {
      hash,
      address,
      caption: 'x',
      tag: 1006,
      tags: [],
      time: 1_700_000_000,
      published: 'published',
    },
    hash
  )!

/** RPC fixtures; they get the network, so one can add to what it answers. */
type RpcFor = (network: MockNetwork) => Record<string, MockRpcHandler>

interface Setup {
  rpc?: RpcFor
  granted?: MockOptions['granted']
  grantOnRequest?: boolean
  account?: 'signed-in' | 'no-permission'
  /** Seeded into the cache before the composable runs. */
  seed?: (client: QueryClient) => void
}

async function setup<T>(use: () => T, options: Setup = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const network = createMockNetwork(demoNetworkData(ME))
  const sdk: MockSdk = createMockSdk({
    network,
    rpc: options.rpc?.(network),
    granted: options.granted,
    grantOnRequest: options.grantOnRequest,
  })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.appinfo = await sdk.get.appinfo()
  session.account = options.account ?? 'signed-in'
  session.address = session.account === 'signed-in' ? ME : null
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  options.seed?.(client)
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = use()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] } }
  )
  const calls = (method: string) => sdk.mock.calls.filter((c) => c.method === method)
  return { result, sdk, client, wrapper, calls, session, network }
}

const never = () => new Promise<never>(() => {})

beforeEach(() => {
  // Nothing here may leave the machine.
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no network in tests')))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('reviews of an offer', () => {
  /** An offer of Анна's with a reply, a review without a score and mine. */
  const oddDetails: RpcFor = () => ({
    getbarteronoffersdetails: () => ({
      offerScores: [
        { hash: 's1'.padEnd(64, '0'), s1: SELLERS.maria, s2: ODD, i1: 2, time: 1_700_000_000 },
        { hash: 's2'.padEnd(64, '0'), s1: SELLERS.dmitry, s2: ODD, i1: 5, time: 1_700_000_100 },
      ],
      comments: [
        comment('c1', SELLERS.maria, 1_700_000_000, { message: 'Старый', info: '0' }),
        comment('c2', SELLERS.anna, 1_700_000_200, { message: 'Ответ', info: '0' }, 'c1'),
        comment('c3', ME, 1_700_000_300, { message: 'Мой', info: '4' }),
        comment('c4', SELLERS.dmitry, 1_700_000_100, { message: 'Дробь', info: '4.5' }),
        comment('c5', SELLERS.dmitry, 1_700_000_050, { message: 'Шесть', info: '6' }),
      ],
    }),
  })

  it('newest first, names of the authors, me as «Вы», stars only from 1–5', async () => {
    const { result } = await setup(() => useOfferReviews(ref(offer(ODD, SELLERS.anna))), {
      rpc: oddDetails,
    })
    await vi.waitFor(() => expect(result.rows.value).toHaveLength(4))
    await vi.waitFor(() => expect(result.rows.value[3]!.name).toBe('Мария В.'))
    expect(result.rows.value.map((r) => [r.id, r.name, r.stars, r.text])).toEqual([
      ['c3'.padEnd(64, '0'), 'Вы', 4, 'Мой'],
      ['c4'.padEnd(64, '0'), 'Дмитрий К.', 4.5, 'Дробь'],
      ['c5'.padEnd(64, '0'), 'Дмитрий К.', null, 'Шесть'],
      ['c1'.padEnd(64, '0'), 'Мария В.', null, 'Старый'],
    ])
    expect(result.average.value).toEqual({ value: 3.5, count: 2 })
  })

  it('a score once and never on my own offer: then only text', async () => {
    const others = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))))
    await vi.waitFor(() => expect(others.result.details.isSuccess.value).toBe(true))
    expect(others.result.form.value).toBe('score')

    const own = await setup(() => useOfferReviews(ref(offer(BIKE, ME))))
    expect(own.result.form.value).toBe('comment')

    const scored = await setup(() => useOfferReviews(ref(offer(ODD, SELLERS.anna))), {
      rpc: () => ({
        getbarteronoffersdetails: () => ({
          offerScores: [{ hash: 's'.repeat(64), s1: ME, s2: ODD, i1: 5, time: 1 }],
          comments: [],
        }),
      }),
    })
    await vi.waitFor(() => expect(scored.result.form.value).toBe('comment'))
  })

  it('stars and text: a score to the author and a review with the score', async () => {
    const { result, calls } = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))))
    await vi.waitFor(() => expect(result.details.isSuccess.value).toBe(true))
    await result.submit({ stars: 5, text: 'Отличный велосипед' })
    await flushPromises()
    expect(calls('barteron.vote').map((c) => c.args[0])).toEqual([
      { share: BIKE, vsaddress: SELLERS.ilya, value: 5 },
    ])
    expect(calls('barteron.comment').map((c) => c.args[0])).toEqual([
      { postid: BIKE, msgparsed: { message: 'Отличный велосипед', info: '5' } },
    ])
    // My vote on its way: no second score.
    expect(result.form.value).toBe('comment')
    expect(result.rows.value[0]).toMatchObject({ name: 'Вы', stars: 5, pending: 'publishing' })
  })

  it('stars only: just the score; text only: a review without a score', async () => {
    const { result, calls } = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))))
    await vi.waitFor(() => expect(result.details.isSuccess.value).toBe(true))
    await result.submit({ stars: 4, text: '' })
    await result.submit({ stars: null, text: 'Ещё вопрос' })
    await flushPromises()
    expect(calls('barteron.vote')).toHaveLength(1)
    expect(calls('barteron.comment').map((c) => c.args[0])).toEqual([
      { postid: BIKE, msgparsed: { message: 'Ещё вопрос', info: '0' } },
    ])
  })

  it('stars that cannot become a score do not go into the review either', async () => {
    // The form was a «score» one before sign-in; then the offer turned out to be mine.
    const { result, calls } = await setup(() => useOfferReviews(ref(offer(BIKE, ME))))
    await result.submit({ stars: 5, text: 'Сам себе' })
    await flushPromises()
    expect(calls('barteron.vote')).toHaveLength(0)
    expect(calls('barteron.comment')[0]?.args[0]).toEqual({
      postid: BIKE,
      msgparsed: { message: 'Сам себе', info: '0' },
    })
  })

  it('signed out and not signing in: nothing goes', async () => {
    const { result, calls } = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))), {
      account: 'no-permission',
      granted: [],
      grantOnRequest: false,
    })
    await result.submit({ stars: 5, text: 'Текст' })
    await flushPromises()
    expect(calls('permissions.request')).toHaveLength(1)
    expect(calls('barteron.vote')).toHaveLength(0)
    expect(calls('barteron.comment')).toHaveLength(0)
  })

  it('a failed score can be given again; a review on its way shows as sending', async () => {
    const { result, sdk } = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))))
    await vi.waitFor(() => expect(result.details.isSuccess.value).toBe(true))
    sdk.barteron.vote = () => Promise.reject(new Error('refused'))
    sdk.barteron.comment = never
    await result.submit({ stars: 5, text: 'Текст' })
    await flushPromises()
    expect(result.form.value).toBe('score')
    expect(result.sending.value).toBe(true)
  })

  it('low scores: blocked under 100 reputation, not while it is unknown', async () => {
    const low = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))), {
      rpc: () => ({ getuserprofile: () => [{ address: ME, name: 'Я', reputation: 99.9 }] }),
    })
    await vi.waitFor(() => expect(low.result.lowScoreBlocked.value).toBe(true))

    const high = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))))
    await flushPromises()
    expect(high.result.lowScoreBlocked.value).toBe(false)

    // Exactly 100 is enough, as in Bastyon (`reputation < 100` blocks).
    const edge = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))), {
      rpc: () => ({ getuserprofile: () => [{ address: ME, name: 'Я', reputation: 100 }] }),
    })
    await vi.waitFor(() => expect(edge.result.details.isSuccess.value).toBe(true))
    await flushPromises()
    expect(edge.result.lowScoreBlocked.value).toBe(false)

    const loading = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))), {
      rpc: () => ({ getuserprofile: never }),
    })
    await flushPromises()
    expect(loading.result.lowScoreBlocked.value).toBe(false)

    const signedOut = await setup(() => useOfferReviews(ref(offer(BIKE, SELLERS.ilya))), {
      account: 'no-permission',
    })
    await flushPromises()
    expect(signedOut.result.lowScoreBlocked.value).toBe(false)
  })
})

function comment(
  label: string,
  address: string,
  time: number,
  msg: { message: string; info: string },
  parent = ''
): RawTx {
  const hash = label.padEnd(64, '0')
  return {
    hash,
    type: TX_TYPE.comment,
    time,
    height: 1,
    s1: address,
    s2: hash,
    s3: ODD,
    ...(parent && { s4: parent.padEnd(64, '0') }),
    p: { s1: JSON.stringify({ message: msg.message, url: '', images: [], info: msg.info }) },
  }
}

describe('reviews about a seller', () => {
  it('from all their offers, newest first, without their own answers', async () => {
    const { result } = await setup(() => useProfileReviews(() => ME), {
      rpc: (network) => ({
        getbarteronoffersdetails: (p) => {
          const r = network.rpc.getbarteronoffersdetails!(p) as { comments: RawTx[] }
          const mine = r.comments[0]!
          return {
            ...r,
            comments: [
              ...r.comments,
              { ...mine, hash: 'me'.padEnd(64, '0'), s1: ME, time: Number(mine.time) + 10 },
              { ...mine, hash: 'an'.padEnd(64, '0'), s4: 'x'.repeat(64), time: 9e9 },
              {
                ...mine,
                hash: 'six'.padEnd(64, '0'),
                time: 1,
                p: { s1: JSON.stringify({ message: 'Шесть', url: '', images: [], info: '6' }) },
              },
            ],
          }
        },
      }),
    })
    await vi.waitFor(() => expect(result.loading.value).toBe(false))
    await vi.waitFor(() => expect(result.rows.value[0]?.name).toBe('Мария В.'))
    expect(result.rows.value.map((r) => [r.name, r.stars, r.offer.id, r.offer.title])).toEqual([
      ['Мария В.', 5, txid('headphones-mine'), 'Наушники накладные'],
      ['Дмитрий К.', 4, txid('laptop-mine'), 'Ноутбук 14", 16 ГБ'],
      // A score outside 1–5 is no stars.
      ['Мария В.', null, txid('headphones-mine'), 'Наушники накладные'],
    ])
    expect(result.error.value).toBeNull()
  })

  it('a node that does not answer: an error, not endless loading', async () => {
    const { result } = await setup(() => useProfileReviews(() => ME), {
      rpc: () => ({
        getbarteronoffersbyaddress: () => {
          throw new Error('timeout')
        },
      }),
    })
    await vi.waitFor(() => expect(result.error.value).toBeTruthy())
    expect(result.loading.value).toBe(false)
    expect(result.rows.value).toEqual([])
  })

  it('nobody: no offers, no reviews, not loading', async () => {
    const { result } = await setup(() =>
      useProfileReviews(() => 'PNobody1111111111111111111111111111')
    )
    await vi.waitFor(() => expect(result.loading.value).toBe(false))
    expect(result.rows.value).toEqual([])
  })
})

describe('moderation of a low score, the user side', () => {
  const moderators = (client: QueryClient, accounts: BarteronAccount[]) =>
    client.setQueryData(['barteron', 'moderators'], accounts)
  const onDuty = (address: string, voting: Record<string, unknown> = {}): BarteronAccount => ({
    ...emptyAccount(address),
    metaData: { votingModeration: { moderator: { status: 'available' }, ...voting } },
  })

  it('a decision of a moderator: allowed for the coffee machine, nothing for the bike', async () => {
    const coffee = await setup(() => useScoreModeration(offer(COFFEE, SELLERS.dmitry)))
    await vi.waitFor(() => expect(coffee.result.state.value.kind).toBe('allowed'))
    expect(coffee.result.allowedScore.value).toBe(2)
    expect(coffee.result.state.value).toMatchObject({
      decision: { moderator: SELLERS.ilya, status: 'allowed' },
    })

    const bike = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)))
    await vi.waitFor(() => expect(bike.result.checking.value).toBe(false))
    expect(bike.result.state.value).toEqual({ kind: 'none' })
    expect(bike.result.allowedScore.value).toBeNull()
  })

  it('rejected, and my request waiting', async () => {
    const now = Date.now()
    const rejected = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      seed: (client) =>
        moderators(client, [
          onDuty(SELLERS.ilya, {
            accessItems: [
              {
                createdAt: now - 1000,
                offerId: BIKE,
                userAddress: ME,
                score: 1,
                status: 'rejected',
              },
            ],
          }),
        ]),
    })
    expect(rejected.result.state.value.kind).toBe('rejected')

    const waiting = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      seed: (client) => {
        moderators(client, [onDuty(SELLERS.ilya)])
        client.setQueryData(keys.account(ME), {
          ...emptyAccount(ME),
          hash: 'h'.repeat(64),
          metaData: {
            votingModeration: {
              requestItems: [
                { createdAt: now - 1000, offerId: BIKE, score: 2, moderator: SELLERS.ilya },
              ],
            },
          },
        })
      },
    })
    expect(waiting.result.state.value).toEqual({
      kind: 'waiting',
      request: { createdAt: now - 1000, score: 2, moderator: SELLERS.ilya },
    })
  })

  it('a request: to a moderator on duty who is not me, the chat, then my profile', async () => {
    const { result, calls } = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)))
    await vi.waitFor(() => expect(result.checking.value).toBe(false))
    await vi.waitFor(() => expect(calls('rpc').length).toBeGreaterThan(0))
    await flushPromises()
    expect(await result.request(2, 'Колесо погнуто')).toBe('sent')
    expect(calls('chat.getOrCreateRoom')[0]?.args[0]).toEqual({
      users: [SELLERS.ilya],
      parameters: {},
    })
    const messages = (calls('chat.send')[0]?.args[0] as { content: { messages: string[] } }).content
      .messages
    expect(messages.slice(0, 2)).toEqual([
      'Заявка на модерацию низкой оценки объявлению',
      'Причина: Колесо погнуто',
    ])
    expect(decodeURIComponent(messages[2]!)).toContain(
      `barter/moderation?offer=${BIKE}&user=${ME}&score=2&reason=`
    )
    await flushPromises()
    const account = calls('barteron.account')[0]?.args[0] as {
      metaData: { votingModeration: { requestItems: unknown[] } }
    }
    expect(account.metaData.votingModeration.requestItems.at(-1)).toMatchObject({
      offerId: BIKE,
      score: 2,
      moderator: SELLERS.ilya,
    })
    await vi.waitFor(() => expect(result.state.value.kind).toBe('waiting'))
  })

  it('nobody on duty: no chat, no request in my profile', async () => {
    const { result, calls } = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      rpc: () => ({
        getbarteronaccounts: () => [],
        getuserprofile: () => [{ address: ME, name: 'Я', reputation: 150 }],
      }),
    })
    await flushPromises()
    expect(await result.request(2, 'Причина')).toBe('nobody')
    expect(calls('chat.getOrCreateRoom')).toHaveLength(0)
    expect(calls('barteron.account')).toHaveLength(0)
  })

  it('I am the only moderator on duty: nobody, not a chat with myself', async () => {
    const meOnDuty = {
      hash: 'h'.repeat(64),
      type: TX_TYPE.account,
      s1: ME,
      p: {
        s4: JSON.stringify({
          a: [],
          m: { votingModeration: { moderator: { status: 'available' } } },
        }),
      },
    }
    const { result, calls } = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      rpc: () => ({ getbarteronaccounts: () => [meOnDuty] }),
    })
    await flushPromises()
    expect(await result.request(2, 'Причина')).toBe('nobody')
    expect(calls('chat.getOrCreateRoom')).toHaveLength(0)
  })

  it('the chat did not open: no request in my profile', async () => {
    const { result, calls } = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      granted: ['account'],
      grantOnRequest: false,
    })
    await flushPromises()
    expect(await result.request(2, 'Причина')).toBe('failed')
    expect(calls('barteron.account')).toHaveLength(0)
  })

  it('my profile on its way: wait for it; the node silent: failed, and the form can say so', async () => {
    const updating = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)))
    await flushPromises()
    updating.sdk.barteron.account = never
    void useTxStore().send('account', { address: ME })
    expect(await updating.result.request(2, 'Причина')).toBe('updating')

    const silent = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      rpc: () => ({
        getbarteronaccounts: () => {
          throw new Error('timeout')
        },
      }),
    })
    await vi.waitFor(() => expect(silent.result.checkFailed.value).toBe(true))
    expect(await silent.result.request(2, 'Причина')).toBe('failed')
    expect(silent.calls('chat.getOrCreateRoom')).toHaveLength(0)
  })

  it('the chat with a moderator opens without messages; without one — nothing', async () => {
    const { result, calls } = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)))
    result.openChat(null)
    result.openChat(SELLERS.ilya)
    await flushPromises()
    expect(calls('chat.getOrCreateRoom').map((c) => c.args[0])).toEqual([
      { users: [SELLERS.ilya], parameters: {} },
    ])
    expect(calls('chat.send')).toHaveLength(0)
  })

  it('no offer, or signed out: nothing to check and no request', async () => {
    const none = await setup(() => useScoreModeration(null))
    expect(none.result.state.value).toEqual({ kind: 'none' })
    expect(await none.result.request(2, 'x')).toBe('failed')

    const out = await setup(() => useScoreModeration(offer(BIKE, SELLERS.ilya)), {
      account: 'no-permission',
    })
    expect(out.result.state.value).toEqual({ kind: 'none' })
    expect(out.calls('rpc')).toHaveLength(0)
  })
})

describe('the review form', () => {
  async function form(props: Record<string, unknown>, options: Setup = {}) {
    const ctx = await setup(() => null, options)
    const wrapper = mount(ReviewForm, {
      props: { offer: offer(BIKE, SELLERS.ilya), form: 'score', ...props },
      global: {
        plugins: [
          ctx.wrapper.vm.$pinia,
          i18n,
          ctx.wrapper.vm.$router,
          [VueQueryPlugin, { queryClient: ctx.client }],
        ],
      },
      attachTo: document.body,
    })
    return { ...ctx, wrapper }
  }
  const star = (wrapper: ReturnType<typeof mount>, n: number) =>
    wrapper.findAll('[role="radio"]')[n - 1]!.trigger('click')

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('a review no longer than the hosts take', async () => {
    const { wrapper } = await form({})
    expect(wrapper.find('textarea').attributes('maxlength')).toBe('915')
  })

  it('signed out, a low score: no word about reputation; the button signs in first', async () => {
    const { wrapper, calls } = await form(
      {},
      { account: 'no-permission', granted: [], grantOnRequest: false }
    )
    await star(wrapper, 2)
    expect(wrapper.text()).not.toContain('стаж')
    expect(wrapper.find('[data-testid="moderation-needed"]').exists()).toBe(true)
    await wrapper.find('[data-testid="moderation-open"]').trigger('click')
    await flushPromises()
    expect(calls('permissions.request')).toHaveLength(1)
    expect(document.querySelector('[data-testid="moderation-request"]')).toBeNull()
  })

  it('the node did not say what the moderator decided: say so and let me try again', async () => {
    const { wrapper, calls } = await form(
      {},
      {
        rpc: () => ({
          getbarteronaccounts: () => {
            throw new Error('timeout')
          },
        }),
      }
    )
    await star(wrapper, 2)
    await vi.waitFor(() =>
      expect(wrapper.text()).toContain('Не удалось проверить решение модератора')
    )
    expect(wrapper.find('[data-testid="moderation-open"]').exists()).toBe(false)
    const before = calls('rpc').length
    await wrapper.find('[data-testid="moderation-recheck"]').trigger('click')
    await flushPromises()
    expect(calls('rpc').length).toBeGreaterThan(before)
  })

  it('declining to sign in keeps the text', async () => {
    const { wrapper } = await form(
      { form: 'comment' },
      { account: 'no-permission', granted: [], grantOnRequest: false }
    )
    await wrapper.find('textarea').setValue('Длинный отзыв')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Длинный отзыв')
  })

  it('signed in: the text goes and the form empties', async () => {
    const { wrapper } = await form({ form: 'comment' })
    await wrapper.find('textarea').setValue('  Спасибо  ')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toEqual([[{ stars: null, text: 'Спасибо' }]])
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
  })
})
