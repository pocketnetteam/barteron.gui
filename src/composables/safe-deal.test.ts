import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { useOffer } from '@/api/queries'
import DealActionCard from '@/components/deal/DealActionCard.vue'
import { BAN_LIST } from '@/config/ban-list'
import { i18n, setLocale } from '@/i18n'
import { createDealId, dealOpReturn, type DealParams } from '@/models/safe-deal'
import { TX_TYPE, type RawTx } from '@/models/tx'
import { createAppRouter } from '@/router'
import { createMockSdk, MOCK_ADDRESS, type MockOptions, type MockSdk } from '@/sdk/mock'
import { demoDeals, demoNetworkData, SELLERS } from '@/sdk/mock-data'
import { createMockNetwork, MOCK_HEIGHT, type MockTransfer } from '@/sdk/mock-network'
import { useDealsStore } from '@/stores/deals'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { useUiStore } from '@/stores/ui'
import { transferFailure, useDeal, useDealList, useDealTransfer, useGuarantors } from './safe-deal'

/**
 * Safe deals on the mock network (sdk/mock-data `demoDeals`):
 * - the tablet: Илья sells, I buy, Мария guarantees — nothing paid yet (1);
 * - the bike: Илья sells, Анна buys, I guarantee — paid (2);
 * - my laptop: Мария buys, Илья guarantees, his payout to me is one block old (3a);
 * - the phone: Дмитрий sells, I buy, Илья guarantees — done (4a).
 */
const ME = MOCK_ADDRESS
const STRANGER = 'PStranger1111111111111111111111111'
const hex = (label: string) =>
  Array.from(label, (c) => c.charCodeAt(0).toString(16))
    .join('')
    .padEnd(64, '0')
    .slice(0, 64)
/** A transfer of the deal on the mock chain, so many blocks ago. */
const onChain = (
  d: DealParams,
  from: string,
  to: string,
  pkoin: number,
  ago: number
): MockTransfer => ({
  addrFrom: from,
  addrTo: to,
  hash: hex(`${d.id.slice(0, 6)}${from.slice(5, 9)}${ago}`),
  height: MOCK_HEIGHT - ago,
  amount: Math.round(pkoin * 1e8),
  time: 1_700_000_000,
  opreturn: dealOpReturn(d.id),
})
const [TABLET, BIKE, LAPTOP, PHONE] = demoDeals(ME).deals.map(({ savedAt: _s, ...d }) => d) as [
  DealParams,
  DealParams,
  DealParams,
  DealParams,
]

interface Setup {
  granted?: MockOptions['granted']
  grantOnRequest?: boolean
  account?: 'signed-in' | 'no-permission'
  address?: string
  /** Runs before the composable: localStorage as the device has it. */
  before?: () => void
  /** Runs on the mock before anything reads: to break a request. */
  prepare?: (sdk: MockSdk) => void
  /** More on the mock chain than the demo has. */
  transfers?: MockTransfer[]
  accounts?: RawTx[]
  offers?: RawTx[]
}

async function setup<T>(use: () => T, options: Setup = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  setLocale('ru')
  const data = demoNetworkData(ME)
  const network = createMockNetwork({
    ...data,
    transfers: [...(data.transfers ?? []), ...(options.transfers ?? [])],
    accounts: [...(data.accounts ?? []), ...(options.accounts ?? [])],
    offers: [...(data.offers ?? []), ...(options.offers ?? [])],
    broadcastMs: 0,
  })
  const sdk: MockSdk = createMockSdk({
    network,
    granted: options.granted,
    grantOnRequest: options.grantOnRequest,
  })
  options.prepare?.(sdk)
  options.before?.()
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.mode = 'mock'
  session.appinfo = await sdk.get.appinfo()
  session.account = options.account ?? 'signed-in'
  session.address = session.account === 'signed-in' ? (options.address ?? ME) : null
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
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
  const calls = (method: string, first?: string) =>
    sdk.mock.calls.filter((c) => c.method === method && (!first || c.args[0] === first))
  return { result, sdk, calls, session }
}

beforeEach(() => {
  localStorage.clear()
  // Nothing here may leave the machine.
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no network in tests')))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('a deal as each participant sees it', () => {
  it.each([
    ['the tablet', TABLET, 'buyer', '1'],
    ['the bike', BIKE, 'validator', '2'],
    ['my laptop', LAPTOP, 'seller', '3a'],
    ['the phone', PHONE, 'buyer', '4a'],
  ] as const)('%s: my part and the status from the chain', async (_, deal, role, status) => {
    const { result } = await setup(() => useDeal(deal))
    await vi.waitFor(() => expect(result.state.value?.status).toBe(status))
    expect(result.role.value).toBe(role)
    expect(result.others.value).not.toContain(ME)
    expect(result.others.value).toHaveLength(2)
  })

  it('the guarantor sees what came; the others are the buyer and the seller', async () => {
    const { result } = await setup(() => useDeal(BIKE))
    await vi.waitFor(() => expect(result.state.value).not.toBeNull())
    expect(result.state.value).toMatchObject({ status: '2', paid: 3978 })
    expect(result.seller.value).toBe(SELLERS.ilya)
    expect(result.others.value).toEqual([SELLERS.anna, SELLERS.ilya])
  })

  it('the money back: cancelled, the buyer has it', async () => {
    const t = { offer: BIKE.offer, buyer: ME, validator: SELLERS.maria, fee: '2' }
    const link = { id: createDealId(t, '00000000000000dd'), ...t }
    const { result } = await setup(() => useDeal(link), {
      transfers: [
        onChain(link, ME, SELLERS.maria, 1020, 100),
        onChain(link, SELLERS.maria, ME, 1020, 50),
      ],
    })
    await vi.waitFor(() => expect(result.state.value?.status).toBe('4b'))
    expect(result.state.value).toMatchObject({ paid: 1020, transfer: { to: ME, amount: 1020 } })
  })

  it('a finished deal drops my «ждём блок» record, as the old page did', async () => {
    const { result } = await setup(() => useDeal(PHONE), {
      before: () =>
        localStorage.setItem(
          `${ME}_safeDeal`,
          JSON.stringify({
            [PHONE.id]: { currentStatus: '1', timestamp: Date.now(), transaction: null },
          })
        ),
    })
    await vi.waitFor(() => expect(result.state.value?.status).toBe('4a'))
    expect(JSON.parse(localStorage.getItem(`${ME}_safeDeal`)!)).toEqual({})
  })

  it('my payment already in a block: the chain says so, not «ждём блок»', async () => {
    const { result } = await setup(() => useDeal(TABLET), {
      transfers: [onChain(TABLET, ME, SELLERS.maria, 1020, 0)],
      before: () =>
        localStorage.setItem(
          `${ME}_safeDeal`,
          JSON.stringify({
            [TABLET.id]: { currentStatus: '1', timestamp: Date.now(), transaction: 'f'.repeat(64) },
          })
        ),
    })
    await vi.waitFor(() => expect(result.state.value?.paying).not.toBeNull())
    expect(result.state.value?.status).toBe('1')
    expect(result.sending.value).toBeNull()
  })

  it('someone else, or nobody signed in: no part, nothing asked about the money', async () => {
    for (const options of [{ address: STRANGER }, { account: 'no-permission' as const }]) {
      const { result, calls } = await setup(() => useDeal(TABLET), options)
      expect(result.role.value).toBeNull()
      expect(result.state.value).toBeNull()
      expect(calls('rpc', 'getfromtotransactions')).toHaveLength(0)
    }
  })

  it('one person in two parts: no part, nothing asked, not kept on the device', async () => {
    // Made by hand: I buy my own laptop; Илья guarantees the tablet he sells.
    const terms = [
      { offer: LAPTOP.offer, buyer: ME, validator: SELLERS.ilya, fee: '2' },
      { offer: TABLET.offer, buyer: ME, validator: SELLERS.ilya, fee: '2' },
    ]
    for (const t of terms) {
      const link = { id: createDealId(t, '0123456789abcdef'), ...t }
      const { result, calls } = await setup(() => ({ deal: useDeal(link), deals: useDealsStore() }))
      expect(result.deal.conflict.value).toBe(true)
      expect(result.deal.role.value).toBeNull()
      expect(calls('rpc', 'getfromtotransactions')).toHaveLength(0)
    }
  })
})

describe('a seller on the ban list', () => {
  // Banned in the middle of a deal: the list changes with a deploy.
  const BANNED = BAN_LIST[0]!
  const OFFER = 'e'.repeat(64)
  const offerTx: RawTx = {
    hash: OFFER,
    type: TX_TYPE.offer,
    height: MOCK_HEIGHT - 500,
    time: 1_700_000_000,
    s1: BANNED,
    s2: OFFER,
    p: {
      s1: 'ru-RU',
      s2: 'Велосипед',
      s3: 'Почти новый',
      s4: '{"t":1006,"a":[],"c":"used","p":"published"}',
      s6: 'srywc',
      i1: 100000,
    },
  }
  const dealOf = (buyer: string, validator: string, random: string): DealParams => {
    const t = { offer: OFFER, buyer, validator, fee: '2' }
    return { id: createDealId(t, random), ...t }
  }
  const PAID = dealOf(SELLERS.anna, ME, '00000000000000b2')
  const UNPAID = dealOf(ME, SELLERS.maria, '00000000000000b1')

  it('the guarantor holding the money still has the deal: the offer, the seller, the status', async () => {
    const { result } = await setup(() => useDeal(PAID), {
      offers: [offerTx],
      transfers: [onChain(PAID, SELLERS.anna, ME, 1020, 50)],
    })
    await vi.waitFor(() => expect(result.state.value?.status).toBe('2'))
    expect(result.offer.value?.hash).toBe(OFFER)
    expect(result.seller.value).toBe(BANNED)
    expect(result.role.value).toBe('validator')
    expect(result.sellerBanned.value).toBe(true)
  })

  it('the buyer before paying: the deal opens, marked as the banned seller’s', async () => {
    const { result } = await setup(() => useDeal(UNPAID), { offers: [offerTx] })
    await vi.waitFor(() => expect(result.state.value?.status).toBe('1'))
    expect(result.role.value).toBe('buyer')
    expect(result.sellerBanned.value).toBe(true)
  })

  it('a seller not on the list is not marked', async () => {
    const { result } = await setup(() => useDeal(BIKE))
    await vi.waitFor(() => expect(result.state.value).not.toBeNull())
    expect(result.sellerBanned.value).toBe(false)
  })

  it('«Сделки» shows its status, not «объявление не найдено»', async () => {
    const { result } = await setup(() => useDealList(), {
      offers: [offerTx],
      transfers: [onChain(PAID, SELLERS.anna, ME, 1020, 50)],
      before: () => localStorage.setItem(`${ME}_deals`, JSON.stringify([{ ...PAID, savedAt: 1 }])),
    })
    await vi.waitFor(() => expect(result.items.value[0]?.status).toBe('ready'))
    expect(result.items.value[0]).toMatchObject({ role: 'validator', state: { status: '2' } })
  })

  it('the offer page still hides it: its cache is apart from the deal’s', async () => {
    const { result } = await setup(() => ({ deal: useDeal(PAID), page: useOffer(OFFER) }), {
      offers: [offerTx],
    })
    await vi.waitFor(() => expect(result.deal.offer.value?.hash).toBe(OFFER))
    await vi.waitFor(() => expect(result.page.isSuccess.value).toBe(true))
    expect(result.page.data.value).toBeNull()
  })
})

describe('sending money', () => {
  const pay = {
    to: TABLET.validator,
    amount: 1020,
    feemode: 'exclude' as const,
    status: '1' as const,
  }
  const transfer = () => ({
    t: useDealTransfer(
      () => TABLET,
      () => 'Планшет',
      () => [SELLERS.ilya, SELLERS.maria]
    ),
    deals: useDealsStore(),
    tx: useTxStore(),
  })

  it('the buyer pays: the amount, the fee mode and «Safe deal <id>»; the link goes to the chat', async () => {
    const { result, calls } = await setup(transfer, { granted: ['account', 'payment', 'chat'] })
    expect(await result.t.send(pay)).toBe(true)
    expect(calls('payment').map((c) => c.args[0])).toEqual([
      {
        recievers: [{ address: TABLET.validator, amount: 1020 }],
        feemode: 'exclude',
        message: `Safe deal ${TABLET.id}`,
      },
    ])
    const txid = result.t.sent.value?.txid
    expect(txid).toMatch(/^[0-9a-f]{64}$/)
    // «Ждём блок» holds at this status, in either version of the app.
    expect(result.deals.sentAt(TABLET.id, '1')).toMatchObject({
      currentStatus: '1',
      transaction: txid,
    })
    expect(JSON.parse(localStorage.getItem(`${ME}_safeDeal`)!)[TABLET.id].transaction).toBe(txid)
    await vi.waitFor(() => expect(calls('chat.send')).toHaveLength(1))
    expect(JSON.stringify(calls('chat.send'))).toContain(`bastyon://transactionview?stx=${txid}`)
  })

  it('two presses at the same moment send one transfer', async () => {
    const { result, calls } = await setup(transfer, { granted: ['account', 'payment', 'chat'] })
    const done = await Promise.all([result.t.send(pay), result.t.send(pay)])
    expect(done.sort()).toEqual([false, true])
    expect(calls('payment')).toHaveLength(1)
  })

  it('the wallet closed: nothing recorded, nothing in the chat, a press again works', async () => {
    const { result, calls, sdk } = await setup(transfer, {
      granted: ['account', 'payment', 'chat'],
    })
    sdk.mock.failNext('payment')
    expect(await result.t.send(pay)).toBe(false)
    expect(result.t.failure.value?.kind).toBe('cancel')
    expect(result.deals.sentAt(TABLET.id, '1')).toBeNull()
    expect(result.tx.items).toHaveLength(0)
    expect(calls('chat.send')).toHaveLength(0)
    expect(await result.t.send(pay)).toBe(true)
    expect(result.t.failure.value).toBeNull()
  })

  it('not enough PKOIN, or another reason: said so, nothing recorded', async () => {
    const { result, sdk } = await setup(transfer, { granted: ['account', 'payment', 'chat'] })
    vi.spyOn(sdk, 'payment').mockRejectedValueOnce('actions_totalAmountSmallerThanFee')
    expect(await result.t.send(pay)).toBe(false)
    expect(result.t.failure.value?.kind).toBe('funds')
    vi.spyOn(sdk, 'payment').mockRejectedValueOnce(new Error('node is down'))
    expect(await result.t.send(pay)).toBe(false)
    expect(result.t.failure.value).toEqual({ kind: 'other', text: 'node is down' })
    expect(result.deals.sentAt(TABLET.id, '1')).toBeNull()
  })

  it('Barteron may not ask for transfers: Bastyon’s settings, nothing sent', async () => {
    const { result, calls } = await setup(() => ({ ...transfer(), ui: useUiStore() }), {
      granted: ['account', 'chat'],
      grantOnRequest: false,
    })
    expect(await result.t.send(pay)).toBe(false)
    expect(result.t.failure.value?.kind).toBe('forbid')
    expect(result.ui.dialog).toBe('permissions')
    expect(calls('payment')).toHaveLength(0)
  })

  it('after my payment the page says «ждём блок» until the chain shows it', async () => {
    const { result } = await setup(
      () => ({ deal: useDeal(TABLET), other: useDeal(PHONE), ...transfer() }),
      { granted: ['account', 'payment', 'chat'] }
    )
    await vi.waitFor(() => expect(result.deal.state.value?.status).toBe('1'))
    await vi.waitFor(() => expect(result.other.state.value?.status).toBe('4a'))
    expect(result.deal.sending.value).toBeNull()
    await result.t.send(pay)
    const txid = result.t.sent.value?.txid
    expect(result.deal.sending.value?.txid).toBe(txid)
    // Another deal is not on its way because of it.
    expect(result.other.sending.value).toBeNull()
    // The host still has it on its way: that alone holds «ждём блок», past 20 minutes too.
    result.deals.clearSent(TABLET.id)
    expect(result.tx.items[0]?.status).toBe('waiting')
    expect(result.deal.sending.value?.txid).toBe(txid)
  })

  it('signed out and no sign-in: nothing sent', async () => {
    const { result, calls } = await setup(transfer, {
      account: 'no-permission',
      grantOnRequest: false,
    })
    expect(await result.t.send(pay)).toBe(false)
    expect(calls('payment')).toHaveLength(0)
  })
})

describe('the action card', () => {
  const transferOf = (txid: string, amount: number, height = 900) => ({
    txid,
    from: SELLERS.anna,
    to: ME,
    amount,
    height,
    time: 0,
  })
  const card = (props: Partial<InstanceType<typeof DealActionCard>['$props']> = {}) => {
    const send = vi.fn(async () => true)
    const wrapper = mount(DealActionCard, {
      props: {
        role: 'validator',
        state: { status: '2', paid: 1000, transfer: transferOf('p1', 1000), paying: null },
        feePercent: 2,
        variant: 'buyer',
        listed: null,
        sending: null,
        names: { buyer: 'Анна', seller: 'Илья', validator: 'Я' },
        addresses: { buyer: SELLERS.anna, seller: SELLERS.ilya, validator: ME },
        send,
        ...props,
      },
      global: { plugins: [i18n] },
      attachTo: document.body,
    })
    return { wrapper, send }
  }
  const calcText = (w: { get: (s: string) => { text: () => string } }) =>
    w.get('[data-testid="deal-calc"]').text().replace(/\s/g, ' ')
  const confirmButton = () =>
    document.querySelector<HTMLButtonElement>('[data-testid="transfer-confirm"]')

  beforeEach(() => {
    setActivePinia(createPinia())
    setLocale('ru')
  })

  it('the seller is banned: the buyer gets no payment form; the guarantor is warned and keeps both choices', async () => {
    const unpaid = { status: '1' as const, paid: 0, transfer: null, paying: null }
    const buyer = card({ role: 'buyer', state: unpaid, listed: 1000, sellerBanned: true })
    expect(buyer.wrapper.get('[data-testid="deal-action"]').attributes('data-mode')).toBe('banned')
    expect(buyer.wrapper.get('h2').text()).toBe('Оплата недоступна')
    expect(buyer.wrapper.find('.dac--turn').exists()).toBe(false)
    expect(buyer.wrapper.get('[data-testid="deal-seller-banned"]').text()).toContain(
      'Не переводите оплату'
    )
    expect(buyer.wrapper.find('[data-testid="deal-value"]').exists()).toBe(false)
    expect(buyer.wrapper.find('[data-testid="deal-transfer"]').exists()).toBe(false)
    buyer.wrapper.unmount()

    const guarantor = card({ sellerBanned: true })
    expect(guarantor.wrapper.get('[data-testid="deal-seller-banned"]').text()).toContain(
      'вернуть оплату покупателю'
    )
    expect(guarantor.wrapper.find('[data-testid="deal-transfer"]').exists()).toBe(true)
    expect(guarantor.wrapper.find('[data-testid="deal-verdict"]').exists()).toBe(true)
    guarantor.wrapper.unmount()

    // Not on the list: the usual form and no warning.
    const calm = card({ role: 'buyer', state: unpaid, listed: 1000 })
    expect(calm.wrapper.get('[data-testid="deal-action"]').attributes('data-mode')).toBe('pay')
    expect(calm.wrapper.find('[data-testid="deal-seller-banned"]').exists()).toBe(false)
    calm.wrapper.unmount()
    const calmGuarantor = card()
    expect(calmGuarantor.wrapper.find('[data-testid="deal-seller-banned"]').exists()).toBe(false)
    calmGuarantor.wrapper.unmount()
  })

  it('a transfer refused with a host code: its words, not the code', () => {
    const coded = card({ failure: { kind: 'other', text: 'actions_noinputs_wait' } })
    expect(coded.wrapper.get('[data-testid="deal-failure"]').text()).toContain(
      'Кошелёк Bastyon ответил: PKOIN на счёте ещё ждут подтверждения сети'
    )
    coded.wrapper.unmount()
    // A sentence from bastyon-nextgen stays as it came.
    const said = card({ failure: { kind: 'other', text: 'Нода не отвечает' } })
    expect(said.wrapper.get('[data-testid="deal-failure"]').text()).toContain(
      'Кошелёк Bastyon ответил: Нода не отвечает'
    )
    said.wrapper.unmount()
  })

  it('one more payment on its way: the guarantor is told to wait for it', async () => {
    const { wrapper } = card({
      state: {
        status: '2',
        paid: 1000,
        transfer: transferOf('p1', 1000),
        paying: transferOf('p2', 262.5, 998),
      },
    })
    expect(wrapper.get('[data-testid="deal-paying-more"]').text()).toContain('262,5 PKOIN')
    wrapper.unmount()
    const calm = card()
    expect(calm.wrapper.find('[data-testid="deal-paying-more"]').exists()).toBe(false)
    calm.wrapper.unmount()
  })

  it('the buyer: the agreed price, the fee half each, the exact amount to the guarantor', async () => {
    const { wrapper, send } = card({
      role: 'buyer',
      state: { status: '1', paid: 0, transfer: null, paying: null },
      variant: 'inHalf',
      listed: 1000,
    })
    expect(calcText(wrapper)).toContain('1 010 PKOIN')
    await wrapper.get('input[data-testid="deal-value"]').setValue('1 250,5')
    expect(calcText(wrapper)).toContain('1 263,01 PKOIN')
    await wrapper.get('[data-testid="deal-confirm"] input').setValue(true)
    await wrapper.get('[data-testid="deal-transfer"]').trigger('click')
    await flushPromises()
    confirmButton()!.click()
    await flushPromises()
    expect(send).toHaveBeenCalledWith({ to: ME, amount: 1263.01, feemode: 'exclude' })
    // No price, no transfer.
    await wrapper.get('input[data-testid="deal-value"]').setValue('abc')
    expect(wrapper.find('[data-testid="deal-transfer"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('the guarantor gives it back: the whole payment, the network fee out of it', async () => {
    const { wrapper, send } = card()
    const [, no] = wrapper.get('[data-testid="deal-verdict"]').findAll('button')
    await no!.trigger('click')
    expect(calcText(wrapper)).toContain('1 000 PKOIN')
    await wrapper.get('[data-testid="deal-confirm"] input').setValue(true)
    await wrapper.get('[data-testid="deal-transfer"]').trigger('click')
    await flushPromises()
    confirmButton()!.click()
    await flushPromises()
    expect(send).toHaveBeenCalledWith({ to: SELLERS.anna, amount: 1000, feemode: 'include' })
    wrapper.unmount()
  })

  it('the payout goes once, and not if the status went stale while the window was open', async () => {
    const { wrapper, send } = card()
    // Not before «Я проверил…» is ticked.
    expect(wrapper.get('[data-testid="deal-transfer"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-testid="deal-confirm"] input').setValue(true)
    expect(wrapper.get('[data-testid="deal-transfer"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('[data-testid="deal-transfer"]').trigger('click')
    await flushPromises()
    await wrapper.setProps({ stale: true })
    confirmButton()!.click()
    await flushPromises()
    expect(send).not.toHaveBeenCalled()

    await wrapper.setProps({ stale: false })
    await wrapper.get('[data-testid="deal-confirm"] input').setValue(true)
    await wrapper.get('[data-testid="deal-transfer"]').trigger('click')
    await flushPromises()
    confirmButton()!.click()
    await flushPromises()
    expect(send).toHaveBeenCalledWith({ to: SELLERS.ilya, amount: 980.39, feemode: 'exclude' })
    wrapper.unmount()
  })
})

describe('why the wallet did not send', () => {
  it.each([
    ['cancel', 'cancel'],
    ['user_cancelled', 'cancel'],
    [' cancel\n', 'cancel'],
    ['forbid', 'forbid'],
    ['permission:payment', 'forbid'],
    ['actions_totalAmountSmallerThanFee', 'funds'],
    ['actions_totalAmountSmaller', 'funds'],
    ['node is down', 'other'],
    ['', 'other'],
    [null, 'other'],
  ] as const)('«%s» → %s', (raw, kind) => {
    expect(transferFailure(raw)).toBe(kind)
  })
})

describe('deals on this device', () => {
  const deal = (n: number): DealParams => {
    const t = {
      offer: n.toString(16).padStart(64, '0'),
      buyer: ME,
      validator: SELLERS.maria,
      fee: '2',
    }
    return { id: createDealId(t, n.toString(16).padStart(16, '0')), ...t }
  }

  it('kept once, newest first, under my address only', async () => {
    const { result, session } = await setup(() => useDealsStore(), {
      before: () => localStorage.setItem(`${ME}_deals`, '[]'),
    })
    result.remember(deal(1), 1000)
    result.remember(deal(2), 2000)
    result.remember(deal(1), 3000)
    expect(result.list.map((d) => d.id)).toEqual([deal(2).id, deal(1).id])
    expect(JSON.parse(localStorage.getItem(`${ME}_deals`)!)).toHaveLength(2)
    session.address = STRANGER
    await flushPromises()
    expect(result.list).toEqual([])
    session.address = ME
    await flushPromises()
    expect(result.list).toHaveLength(2)
  })

  it('forgotten on request; a record that could never open is not kept', async () => {
    const { result } = await setup(() => useDealsStore(), {
      before: () => localStorage.setItem(`${ME}_deals`, '[]'),
    })
    result.remember(deal(1), 1)
    result.remember({ ...deal(2), offer: 'nope' }, 2)
    expect(result.list.map((d) => d.id)).toEqual([deal(1).id])
    result.forget(deal(1).id)
    expect(result.list).toEqual([])
    expect(localStorage.getItem(`${ME}_deals`)).toBe('[]')
  })

  it('a broken record is dropped, the rest stay', async () => {
    const good = { ...deal(1), savedAt: 5 }
    const { result } = await setup(() => useDealsStore(), {
      before: () =>
        localStorage.setItem(
          `${ME}_deals`,
          JSON.stringify([
            good,
            { ...deal(2), id: 'x' },
            { ...deal(3), offer: 'not-an-offer' },
            { ...deal(4), id: deal(4).id.toUpperCase() },
            { ...deal(5), buyer: 5 },
            { ...deal(6), fee: '' },
            null,
            'deal',
            { ...good, savedAt: 7 },
          ])
        ),
    })
    expect(result.list).toEqual([good])
  })

  it('no more than 100: the oldest go', async () => {
    const { result } = await setup(() => useDealsStore(), {
      before: () => localStorage.setItem(`${ME}_deals`, '[]'),
    })
    for (let n = 1; n <= 105; n++) result.remember(deal(n), n)
    expect(result.list).toHaveLength(100)
    expect(result.list[0]!.id).toBe(deal(105).id)
    expect(result.list.at(-1)!.id).toBe(deal(6).id)
    expect(JSON.parse(localStorage.getItem(`${ME}_deals`)!)).toHaveLength(100)
  })

  it('my transfer: «ждём блок» 20 minutes at the same status; the old app’s record reads too', async () => {
    const now = Date.now()
    const { result } = await setup(() => useDealsStore(), {
      before: () =>
        localStorage.setItem(
          `${ME}_safeDeal`,
          JSON.stringify({
            [TABLET.id]: {
              currentStatus: '1',
              timestamp: now - 5 * 60_000,
              transaction: { odd: 1 },
            },
            [BIKE.id]: { currentStatus: '2', timestamp: 'yesterday' },
          })
        ),
    })
    expect(result.sentAt(TABLET.id, '1', now)).toMatchObject({ transaction: null })
    expect(result.sentAt(TABLET.id, '2', now)).toBeNull()
    expect(result.sentAt(TABLET.id, '1', now + 16 * 60_000)).toBeNull()
    expect(result.sentAt(BIKE.id, '2', now)).toBeNull()
    result.clearSent(TABLET.id)
    expect(result.sentAt(TABLET.id, '1', now)).toBeNull()
    expect(JSON.parse(localStorage.getItem(`${ME}_safeDeal`)!)).toEqual({})
  })
})

describe('guarantors to pick', () => {
  it('those with guarantor settings, without the seller and me; available and cheaper first', async () => {
    // Two of the real guarantors: one has a lower fee but takes no deals now, one has no fee.
    const OFF = 'PMdhZ1gvZXAXmQ6z5ghHz86arfXorxNYgX'
    const NO_FEE = 'PPbNqCweFnTePQyXWR21B9jXWCiDJa2yYu'
    const account = (address: string, validator: object): RawTx => ({
      hash: hex(`acc-${address}`),
      type: TX_TYPE.account,
      height: 2_900_000,
      time: 1_600_000_000,
      s1: address,
      p: { s4: JSON.stringify({ a: [], g: '', s: false, r: 0, d: { validator } }) },
    })
    const { result } = await setup(
      () => ({
        all: useGuarantors(() => []),
        forTablet: useGuarantors(() => [SELLERS.ilya, ME]),
      }),
      {
        accounts: [
          account(OFF, { status: 'unavailable', feePercent: 1 }),
          account(NO_FEE, { status: 'available' }),
        ],
      }
    )
    await vi.waitFor(() => expect(result.all.list.value).toHaveLength(4))
    // I am on the showcase list too, but without guarantor settings.
    expect(result.all.list.value.map((g) => [g.address, g.fee, g.available])).toEqual([
      [SELLERS.ilya, 2, true],
      [SELLERS.maria, 2, true],
      [OFF, 1, false],
      [NO_FEE, null, false],
    ])
    await vi.waitFor(() => expect(result.forTablet.list.value).toHaveLength(3))
    expect(result.forTablet.list.value[0]).toMatchObject({ address: SELLERS.maria, rating: 4.6 })
  })
})

/** The offers of deals do not load until `ok()`: the node refuses them. */
function offersRefused() {
  let refuse = true
  return {
    ok: () => (refuse = false),
    prepare: (sdk: MockSdk) => {
      const real = sdk.rpc.bind(sdk)
      vi.spyOn(sdk, 'rpc').mockImplementation(async (method, parameters, options) => {
        if (method === 'getbarteronoffersbyroottxhashes' && refuse) {
          throw { message: 'Database is busy', name: 'Error' }
        }
        return real(method, parameters, options)
      })
    },
  }
}

/** No request for transfers to or from nobody. */
const noEmptyAddress = (calls: { args: unknown[] }[]) =>
  calls.every((c) => (c.args[1] as unknown[]).every((a) => a !== null && a !== undefined))

describe('«Обновить» after an error', () => {
  it('the deal page: the offer did not load — «обновить» asks for it again, and the deal opens', async () => {
    const refused = offersRefused()
    const { result, calls } = await setup(() => useDeal(TABLET), { prepare: refused.prepare })
    await vi.waitFor(() => expect(result.offerQuery.isError.value).toBe(true))
    // Still refused: asked again, nothing asked about the money of nobody.
    await result.refresh()
    expect(result.offerQuery.isError.value).toBe(true)
    expect(calls('rpc', 'getfromtotransactions')).toHaveLength(0)
    refused.ok()
    await result.refresh()
    await vi.waitFor(() => expect(result.state.value?.status).toBe('1'))
    expect(result.offerQuery.isError.value).toBe(false)
    expect(result.role.value).toBe('buyer')
    expect(noEmptyAddress(calls('rpc', 'getfromtotransactions'))).toBe(true)
  })

  it('«Сделки»: the offers did not load — «обновить» asks for them again', async () => {
    const refused = offersRefused()
    const { result, calls } = await setup(() => useDealList(), {
      prepare: refused.prepare,
      before: () => localStorage.setItem(`${ME}_deals`, JSON.stringify(demoDeals(ME).deals)),
    })
    await vi.waitFor(() => expect(result.offers.isError.value).toBe(true))
    // Not «объявление не найдено»: it did not load.
    expect(result.items.value.map((i) => i.status)).toEqual(['error', 'error', 'error', 'error'])
    await result.refresh()
    expect(calls('rpc', 'getfromtotransactions')).toHaveLength(0)
    refused.ok()
    await result.refresh()
    await vi.waitFor(() => expect(result.active.value).toBe(3))
    expect(noEmptyAddress(calls('rpc', 'getfromtotransactions'))).toBe(true)
    // Each deal's three transfers once: no second round on top of the first.
    await flushPromises()
    expect(calls('rpc', 'getfromtotransactions')).toHaveLength(12)
  })
})

describe('«Сделки» in the cabinet', () => {
  it('each deal with my part and its status; three not finished yet', async () => {
    const { result } = await setup(() => useDealList(), {
      before: () => localStorage.setItem(`${ME}_deals`, JSON.stringify(demoDeals(ME).deals)),
    })
    await vi.waitFor(() => expect(result.active.value).not.toBeNull())
    const rows = Object.fromEntries(
      result.items.value.map((i) => [i.deal.id, [i.role, i.state?.status, i.status]])
    )
    expect(rows).toEqual({
      [TABLET.id]: ['buyer', '1', 'ready'],
      [BIKE.id]: ['validator', '2', 'ready'],
      [LAPTOP.id]: ['seller', '3a', 'ready'],
      [PHONE.id]: ['buyer', '4a', 'ready'],
    })
    expect(result.active.value).toBe(3)
  })

  it('my transfer on its way shows in the row; «обновить» reads again', async () => {
    const { result, calls } = await setup(
      () => ({
        list: useDealList(),
        t: useDealTransfer(
          () => TABLET,
          () => 'Планшет',
          () => []
        ),
      }),
      {
        granted: ['account', 'payment', 'chat'],
        before: () => localStorage.setItem(`${ME}_deals`, JSON.stringify(demoDeals(ME).deals)),
      }
    )
    await vi.waitFor(() => expect(result.list.active.value).toBe(3))
    const row = () => result.list.items.value.find((i) => i.deal.id === TABLET.id)!
    expect(row().sentAt).toBeNull()
    await result.t.send({ to: TABLET.validator, amount: 1020, feemode: 'exclude', status: '1' })
    expect(row().sentAt).toEqual(expect.any(Number))
    // Only that deal's row.
    expect(result.list.items.value.filter((i) => i.sentAt).map((i) => i.deal.id)).toEqual([
      TABLET.id,
    ])
    const asked = calls('rpc', 'getfromtotransactions').length
    await result.list.refresh()
    expect(calls('rpc', 'getfromtotransactions').length).toBe(asked + 12)
  })

  it('an offer that is gone: the deal says so, the others read', async () => {
    const gone = { offer: 'e'.repeat(64), buyer: ME, validator: SELLERS.maria, fee: '2' }
    const { result } = await setup(() => useDealList(), {
      before: () =>
        localStorage.setItem(
          `${ME}_deals`,
          JSON.stringify([
            { ...TABLET, savedAt: 2 },
            { id: createDealId(gone, '0'.repeat(16)), ...gone, savedAt: 1 },
          ])
        ),
    })
    await vi.waitFor(() => expect(result.active.value).not.toBeNull())
    expect(result.items.value.map((i) => i.status)).toEqual(['ready', 'noOffer'])
    expect(result.active.value).toBe(1)
  })
})
