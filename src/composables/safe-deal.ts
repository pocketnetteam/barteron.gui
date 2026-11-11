import { useQueries, useQuery } from '@tanstack/vue-query'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { BarteronApi } from '@/api/barteron'
import { keys, useBarteron, useOffer, useOffersByIds } from '@/api/queries'
import { createLimiter } from '@/lib/limit'
import type { Offer } from '@/models/offer'
import { guarantorAddresses } from '@/config/roles'
import { guarantorState } from '@/models/account'
import {
  dealOpReturn,
  dealRole,
  dealState,
  isDealFinished,
  paymentMessage,
  SAFE_DEAL_API_VERSION,
  SAFE_DEAL_START_HEIGHT,
  type DealChain,
  type DealParams,
  type DealRole,
  type DealState,
  type DealStatus,
} from '@/models/safe-deal'
import { useDealsStore, type StoredDeal } from '@/stores/deals'
import { useSessionStore } from '@/stores/session'
import { useTxStore, type TrackedTx } from '@/stores/tx'
import { useUiStore } from '@/stores/ui'
import { useChat } from './chat'
import { usePeople } from './exchanges'

/** The three directions of a deal's money (old `updateStatus`). */
export async function fetchDealTransfers(
  api: BarteronApi,
  deal: DealParams,
  seller: string
): Promise<Omit<DealChain, 'tip'>> {
  const script = dealOpReturn(deal.id)
  const from = SAFE_DEAL_START_HEIGHT
  const [paid, toSeller, toBuyer] = await Promise.all([
    api.transfers(deal.buyer, deal.validator, script, from),
    api.transfers(deal.validator, seller, script, from),
    api.transfers(deal.validator, deal.buyer, script, from),
  ])
  return { paid, toSeller, toBuyer }
}

/** Height of the last block, shared by every deal on the screen. */
export function useChainHeight(enabled: MaybeRefOrGetter<boolean> = true) {
  const barteron = useBarteron()
  return useQuery({
    queryKey: ['bastyon', 'chain-height'],
    enabled: computed(() => !!barteron.value && toValue(enabled)),
    queryFn: () => barteron.value!.api.chainHeight(),
    staleTime: 20_000,
  })
}

/** The host can read transfers between two addresses (old `safeDealAvailable`). */
export function useSafeDealSupported() {
  const session = useSessionStore()
  return computed(() => (session.appinfo?.transactionsApiVersion ?? 0) >= SAFE_DEAL_API_VERSION)
}

/**
 * One deal as its participants see it: the offer (its author is the
 * seller), my role, the transfers and the status, and my own transfer while
 * it is on its way.
 *
 * - `state` — from the chain; `null` until read;
 * - `sending` — my transfer: the host is still sending it, or it went less
 *   than 20 minutes ago and the chain does not show it yet (old
 *   `waitingForPaymentConfirmation`).
 */
export function useDeal(deal: MaybeRefOrGetter<DealParams | null>) {
  const session = useSessionStore()
  const barteron = useBarteron()
  const txStore = useTxStore()
  const deals = useDealsStore()
  const params = computed(() => toValue(deal))
  const id = computed(() => params.value?.id ?? null)

  const offerQuery = useOffer(() => params.value?.offer)
  const offer = computed(() => offerQuery.data.value ?? null)
  const seller = computed(() => offer.value?.address ?? null)
  const role = computed(() =>
    params.value ? dealRole(params.value, seller.value, session.address) : null
  )
  const readable = computed(() => !!params.value && !!seller.value && !!role.value)

  const height = useChainHeight(readable)
  /** Something is moving: read again every minute. */
  const poll = ref(false)
  const transfers = useQuery({
    queryKey: computed(() => keys.deal(id.value)),
    enabled: computed(() => !!barteron.value && readable.value),
    queryFn: () => fetchDealTransfers(barteron.value!.api, params.value!, seller.value!),
    staleTime: 20_000,
    refetchInterval: computed(() => (poll.value ? 60_000 : false)),
  })

  const state = computed<DealState | null>(() => {
    const t = transfers.data.value
    const tip = height.data.value
    return t && tip ? dealState({ ...t, tip }) : null
  })

  /** My transfer in this deal that the host still sends or that waits for its block. */
  const myTx = computed<TrackedTx | null>(() => {
    for (let i = txStore.items.length - 1; i >= 0; i--) {
      const tx = txStore.items[i]!
      if (tx.kind === 'payment' && tx.target === id.value) return tx
    }
    return null
  })
  const now = ref(Date.now())
  const sending = computed(() => {
    const s = state.value
    if (!s || !id.value) return null
    const tx = myTx.value
    if (tx && (tx.status === 'sending' || tx.status === 'waiting')) {
      return { txid: tx.txid, at: tx.sentAt ?? tx.createdAt }
    }
    // Paid at this status: the block or the six confirmations are still to come.
    const sent = deals.sentAt(id.value, s.status, now.value)
    if (!sent) return null
    // The buyer's payment is already in a block: the chain says so itself.
    if (s.status === '1' && s.paying) return null
    return { txid: sent.transaction, at: sent.timestamp }
  })

  watch(
    () => [state.value?.status, !!sending.value, !!state.value?.paying] as const,
    ([status, mine, paying]) => {
      now.value = Date.now()
      poll.value = mine || paying || status === '3a' || status === '3b'
      // Finished: the old page dropped its record of my transfer too.
      if (status && isDealFinished(status) && id.value) deals.clearSent(id.value)
    },
    { immediate: true }
  )

  const people = usePeople(() =>
    params.value && seller.value ? [params.value.buyer, seller.value, params.value.validator] : []
  )

  const updatedAt = computed(() =>
    Math.max(transfers.dataUpdatedAt.value || 0, height.dataUpdatedAt.value || 0)
  )
  const loading = computed(
    () => readable.value && !state.value && !transfers.isError.value && !height.isError.value
  )
  const error = computed(() => transfers.error.value ?? height.error.value ?? null)
  const refreshing = computed(() => transfers.isFetching.value || height.isFetching.value)

  async function refresh() {
    now.value = Date.now()
    await Promise.all([transfers.refetch(), height.refetch()])
  }

  /** Everyone else in the deal: the members of its chat. */
  const others = computed(() => {
    const p = params.value
    if (!p || !seller.value) return []
    return [p.buyer, seller.value, p.validator].filter((a) => a !== session.address)
  })

  return {
    params,
    offerQuery,
    offer,
    seller,
    role,
    state,
    sending,
    people,
    others,
    updatedAt,
    loading,
    error,
    refreshing,
    refresh,
  }
}

/**
 * Why the wallet did not send:
 * - `cancel` — the window was closed: nothing was taken;
 * - `forbid` — Barteron may not ask for transfers;
 * - `funds` — not enough PKOIN (with or without the network fee);
 * - `other` — anything else, with the host's text.
 */
export type TransferFailure = 'cancel' | 'forbid' | 'funds' | 'other'

export function transferFailure(raw: string | null | undefined): TransferFailure {
  const text = (raw ?? '').trim()
  if (text === 'cancel' || text === 'user_cancelled') return 'cancel'
  if (text === 'forbid' || /^permission/.test(text)) return 'forbid'
  if (/^actions_totalAmountSmaller/.test(text)) return 'funds'
  return 'other'
}

export interface TransferRequest {
  to: string
  amount: number
  /**
   * `exclude` — the network fee on top (payment, payout); `include` — out
   * of the amount (refund), as the old page sent them.
   */
  feemode: 'exclude' | 'include'
  /** The status it was sent at: «ждём блок» lasts while the deal still has it. */
  status: DealStatus
}

/**
 * Sends a transfer of the deal through the Bastyon wallet, with `Safe deal
 * <id>` in OP_RETURN, then the link to the transaction goes to the deal chat
 * (old `makePayment` and `shareSafeDealTransaction`). A closed wallet window
 * is not a transfer: nothing is recorded.
 */
export function useDealTransfer(
  deal: MaybeRefOrGetter<DealParams | null>,
  chatName: MaybeRefOrGetter<string>,
  members: MaybeRefOrGetter<string[]>
) {
  const session = useSessionStore()
  const txStore = useTxStore()
  const deals = useDealsStore()
  const chat = useChat()
  const sending = ref(false)
  const failure = ref<{ kind: TransferFailure; text: string } | null>(null)
  /** Sent just now: «Перевод выполнен» until the page is left. */
  const sent = ref<{ txid: string | null } | null>(null)

  async function send(request: TransferRequest): Promise<boolean> {
    const p = toValue(deal)
    const sdk = session.sdk
    if (!p || !sdk || sending.value) return false
    failure.value = null
    if (!(await session.ensureSignedIn())) return false

    sending.value = true
    try {
      const granted = await sdk.permissions.check({ permission: 'payment' }).catch(() => false)
      if (!granted) {
        await sdk.permissions.request(['payment']).catch(() => undefined)
        if (!(await sdk.permissions.check({ permission: 'payment' }).catch(() => false))) {
          failure.value = { kind: 'forbid', text: '' }
          // Only Bastyon's app settings turn it back on (s8-system «Нужны разрешения»).
          useUiStore().openPermissions(['payment'])
          return false
        }
      }
      const tx = await txStore.send('payment', {
        recievers: [{ address: request.to, amount: request.amount }],
        feemode: request.feemode,
        message: paymentMessage(p.id),
      })
      if (tx.status === 'failed') {
        failure.value = { kind: transferFailure(tx.error), text: tx.error ?? '' }
        txStore.dismiss(tx.id)
        return false
      }
      deals.markSent(p.id, request.status, tx.txid)
      sent.value = { txid: tx.txid }
      if (tx.txid) {
        void chat.open({
          name: toValue(chatName),
          members: toValue(members),
          messages: [`bastyon://transactionview?stx=${tx.txid}`],
          notify: false,
        })
      }
      return true
    } finally {
      sending.value = false
    }
  }

  return { send, sending, failure, sent, chatOpening: chat.opening }
}

export interface GuarantorOption {
  address: string
  name: string
  avatar: string | null
  rating: number
  ratingCount: number
  /** Percent; `null` — not set in the profile. */
  fee: number | null
  /** Takes deals and has a fee: can be chosen (old `getFilteredAdresses`). */
  available: boolean
}

/**
 * Guarantors a buyer can pick (s3-item-dialogs «Выберите гаранта»): those
 * on the list who set guarantor settings in their profile, without the
 * seller and the buyer. Available ones first, the lower fee first, as the old
 * dialog sorted them; unavailable ones are shown greyed out.
 */
export function useGuarantors(
  exclude: MaybeRefOrGetter<readonly string[]>,
  enabled: MaybeRefOrGetter<boolean> = true
) {
  const barteron = useBarteron()
  const addresses = computed(() => {
    const out = toValue(exclude)
    return guarantorAddresses().filter((a) => !out.includes(a))
  })
  const accounts = useQuery({
    queryKey: computed(() => ['barteron', 'guarantors', addresses.value]),
    enabled: computed(() => !!barteron.value && addresses.value.length > 0 && toValue(enabled)),
    queryFn: () => barteron.value!.api.accounts(addresses.value),
  })
  const people = usePeople(addresses)
  const list = computed<GuarantorOption[]>(() =>
    (accounts.data.value ?? [])
      .filter((a) => a.safeDeal.validator && typeof a.safeDeal.validator === 'object')
      .map((a) => {
        const state = guarantorState(a, 0)
        const fee = state.feePercent > 0 ? state.feePercent : null
        const person = people.value.get(a.address)
        return {
          address: a.address,
          name: person?.name || a.address.slice(0, 8),
          avatar: person?.avatar ?? null,
          rating: a.rating,
          ratingCount: a.ratingCount,
          fee,
          available: state.available && fee !== null,
        }
      })
      .sort(
        (a, b) =>
          Number(b.available) - Number(a.available) ||
          (a.fee ?? 100) - (b.fee ?? 100) ||
          (a.address > b.address ? 1 : -1)
      )
  )
  return { list, query: accounts }
}

export interface DealListItem {
  deal: StoredDeal
  offer: Offer | null
  /** `null` — the offer is gone or not loaded: the seller is unknown. */
  role: DealRole | null
  state: DealState | null
  status: 'loading' | 'error' | 'ready' | 'noOffer'
  /** When my transfer in this deal went, while it is on its way; `null` — none. */
  sentAt: number | null
}

/** No more than three deals asked at once: three requests each. */
const dealLimit = createLimiter(3)

/**
 * The deals on this device with their status (s7-deals-desktop): the offers
 * in one request, each deal's transfers in the same cache as its page.
 */
export function useDealList(enabled: MaybeRefOrGetter<boolean> = true) {
  const session = useSessionStore()
  const barteron = useBarteron()
  const deals = useDealsStore()
  const txStore = useTxStore()
  const list = computed(() => (toValue(enabled) ? deals.list : []))
  const offers = useOffersByIds(() => [...new Set(list.value.map((d) => d.offer))])
  const offerOf = (id: string) => offers.data.value?.find((o) => o.hash === id) ?? null
  const height = useChainHeight(() => list.value.length > 0)

  const queries = useQueries({
    queries: computed(() =>
      list.value.map((deal) => {
        const seller = offerOf(deal.offer)?.address ?? null
        return {
          queryKey: keys.deal(deal.id),
          enabled: !!barteron.value && !!seller,
          queryFn: () => dealLimit(() => fetchDealTransfers(barteron.value!.api, deal, seller!)),
          staleTime: 20_000,
        }
      })
    ),
  })

  const items = computed<DealListItem[]>(() =>
    list.value.map((deal, i) => {
      const offer = offerOf(deal.offer)
      const role = offer ? dealRole(deal, offer.address, session.address) : null
      const q = queries.value[i]
      const tip = height.data.value
      const state = q?.data && tip ? dealState({ ...q.data, tip }) : null
      const status: DealListItem['status'] = offers.isPending.value
        ? 'loading'
        : !offer
          ? 'noOffer'
          : state
            ? 'ready'
            : q?.isError || height.isError.value
              ? 'error'
              : 'loading'
      const tx = txStore.items.find(
        (x) =>
          x.kind === 'payment' &&
          x.target === deal.id &&
          (x.status === 'sending' || x.status === 'waiting')
      )
      const sentAt = !state
        ? null
        : tx
          ? (tx.sentAt ?? tx.createdAt)
          : state.status === '1' && state.paying
            ? null
            : (deals.sentAt(deal.id, state.status)?.timestamp ?? null)
      return { deal, offer, role, state, status, sentAt }
    })
  )

  /** Deals not finished yet, once every status is known; `null` — still reading. */
  const active = computed(() => {
    const known = items.value.filter((i) => i.status !== 'loading')
    if (!items.value.length) return 0
    if (known.length < items.value.length) return null
    return items.value.filter((i) => i.state && !isDealFinished(i.state.status)).length
  })

  async function refresh() {
    await Promise.all([height.refetch(), ...queries.value.map((q) => q.refetch())])
  }

  return { items, active, refresh, offers }
}
