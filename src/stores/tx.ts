/**
 * Transactions the app asked Bastyon to send, and their honest status
 * (principle 03): sending to the node → waiting for a block → in the network,
 * or failed with a retry.
 *
 * How the host reports it (pocketnet.gui `js/lib/apps`, bastyon-nextgen
 * `src/mini-apps/tx/app-actions.ts`):
 * - `sdk.barteron.*` / `sdk.payment` resolve with an action; it has a txid
 *   once broadcast, or rejects when the node or the wallet refused;
 * - the host pushes the action again as an `action` event when it lands in a
 *   block (`completed`) or never does (`rejected`, after an hour);
 * - `get.actions()` returns this app's actions of the last day, so after a
 *   reload the pending ones show up again.
 */

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { hangIfBanned } from '@/config/ban'
import { offerFromAlias, type Offer } from '@/models/offer'
import { dealIdFromMessage } from '@/models/deal-transfer'
import { isJsonObject, isTxid, str } from '@/models/tx'
import type { NetStatus } from '@/components/net/NetStatusBadge.vue'
import type { HostAction, HostSdk } from '@/sdk/types'
import { useSessionStore } from './session'

export type TxKind = 'offer' | 'offerRemove' | 'account' | 'review' | 'vote' | 'payment'

export type TxStatus = 'sending' | 'waiting' | 'done' | 'failed'

export interface TrackedTx {
  /** Local id. */
  id: string
  kind: TxKind
  status: TxStatus
  /** What was sent; kept for a retry. `null` for one restored after a reload. */
  payload: unknown
  /** What the transaction is about: offer id or address. */
  target: string | null
  txid: string | null
  actionId: string | null
  /** Host or node message when failed. */
  error: string | null
  attempts: number
  createdAt: number
  sentAt: number | null
  settledAt: number | null
}

type Sender = (sdk: HostSdk, payload: unknown) => Promise<HostAction>

const SENDERS: Record<TxKind, Sender> = {
  offer: (sdk, p) => sdk.barteron.offer(p),
  offerRemove: (sdk, p) => sdk.barteron.removeOffer(p as { hash: string }),
  account: (sdk, p) => sdk.barteron.account(p),
  review: (sdk, p) => sdk.barteron.comment(p),
  vote: (sdk, p) => sdk.barteron.vote(p),
  payment: (sdk, p) => sdk.payment(p),
}

/** Pocketnet makes a block about once a minute. */
export const BLOCK_SECONDS = 60
/** Finished ones stay visible this long, then go. Failed ones stay until dismissed. */
export const DONE_KEEP_MS = 5 * 60 * 1000

const hasKeys = (obj: Record<string, unknown>, keys: string[]) => keys.every((k) => k in obj)

/** Which of our transactions an action is, by its `expObject` (old `isOfferAction` and the rest). */
export function kindOfAction(action: HostAction): TxKind | null {
  const exp = action.expObject
  if (!isJsonObject(exp)) return null
  if (exp.type === 'contentDelete' && 'txidEdit' in exp) return 'offerRemove'
  if (exp.type === 'comment') return 'review'
  if (exp.type === 'upvoteShare') return 'vote'
  // A transfer (bastyon-nextgen tx/app-actions `recordPayment`).
  if (exp.type === 'transaction') return 'payment'
  if (
    hasKeys(exp, [
      'address',
      'hash',
      'language',
      'caption',
      'description',
      'tag',
      'condition',
      'geohash',
    ])
  ) {
    return 'offer'
  }
  if (hasKeys(exp, ['address', 'geohash', 'static', 'radius', 'tags'])) return 'account'
  return null
}

/** What a transaction is about, from what was sent. */
export function targetOf(kind: TxKind, payload: unknown, txid: string | null): string | null {
  const p = isJsonObject(payload) ? payload : {}
  switch (kind) {
    case 'offer':
      // A new offer's id is the txid of its first version.
      return isTxid(p.hash) ? p.hash : txid
    case 'offerRemove':
      return str(p.hash) || str(p.txidEdit) || null
    case 'account':
      return str(p.address) || null
    case 'review':
      return str(p.postid) || null
    case 'vote':
      return str(p.share) || null
    case 'payment':
      // A safe deal transfer: the deal id from its message.
      return dealIdFromMessage(p.message)
  }
}

/** Status for `NetStatusBadge`: withdrawing and deleting read differently from publishing. */
export function netStatusOf(tx: TrackedTx): NetStatus {
  if (tx.status === 'done' || tx.status === 'failed') return tx.status
  if (tx.kind === 'offerRemove') return 'deleting'
  if (tx.kind === 'offer' && isJsonObject(tx.payload) && tx.payload.published === 'withdrawed') {
    return 'removing'
  }
  return tx.status
}

/** Whole minutes left until the next block is likely, at least one. */
export function etaMinutes(tx: TrackedTx, now = Date.now()): number {
  const since = tx.sentAt ? (now - tx.sentAt) / 1000 : 0
  return Math.max(1, Math.ceil((BLOCK_SECONDS - (since % BLOCK_SECONDS)) / 60))
}

/** The host's reason as text; a node code stays a number in text (`-26`), see `lib/tx-errors`. */
export const errorText = (error: unknown): string => {
  if (typeof error === 'string') return error
  if (typeof error === 'number') return String(error)
  if (error instanceof Error) return error.message
  if (isJsonObject(error)) {
    if (typeof error.message === 'string' && error.message) return error.message
    if (typeof error.code === 'string' || typeof error.code === 'number') return String(error.code)
    if (error.error !== undefined) return errorText(error.error)
  }
  return 'unknown'
}

let counter = 0
const localId = () => `tx${Date.now().toString(36)}${(counter++).toString(36)}`

export type TxListener = (tx: TrackedTx) => void

export const useTxStore = defineStore('tx', () => {
  const session = useSessionStore()
  const items = ref<TrackedTx[]>([])
  const listeners = new Set<TxListener>()
  let started = false

  const notify = (tx: TrackedTx) => listeners.forEach((listener) => listener(tx))

  /** Called on every status change; the query layer refreshes data on `done`. */
  function subscribe(listener: TxListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function prune(now = Date.now()) {
    items.value = items.value.filter(
      (tx) => !(tx.status === 'done' && tx.settledAt && now - tx.settledAt > DONE_KEEP_MS)
    )
  }

  function find(action: HostAction): TrackedTx | undefined {
    return items.value.find(
      (tx) =>
        (action.id && tx.actionId === action.id) ||
        (action.transaction && tx.txid === action.transaction)
    )
  }

  /** Applies a host action (answer or event) to an entry. */
  function apply(tx: TrackedTx, action: HostAction, now = Date.now()) {
    if (action.id) tx.actionId = action.id
    if (action.transaction) {
      tx.txid = action.transaction
      tx.sentAt ??= action.sent ? Date.parse(action.sent) || now : now
      tx.target ??= targetOf(tx.kind, tx.payload ?? action.expObject, tx.txid)
    }
    const rejected =
      action.rejected !== undefined && action.rejected !== null && action.rejected !== false
    if (action.completed) {
      tx.status = 'done'
      tx.error = null
      tx.settledAt = now
    } else if (rejected) {
      tx.status = 'failed'
      tx.error = errorText(action.rejected)
      tx.settledAt = now
    } else {
      tx.status = action.transaction ? 'waiting' : 'sending'
    }
  }

  function onAction(action: HostAction) {
    let tx = find(action)
    if (!tx) {
      tx = restore(action)
      if (!tx) return
    }
    const before = tx.status
    apply(tx, action)
    if (tx.status !== before) notify(tx)
    prune()
  }

  /** An action sent before this page loaded. */
  function restore(action: HostAction): TrackedTx | undefined {
    const kind = kindOfAction(action)
    if (!kind) return undefined
    const tx = reactive<TrackedTx>({
      id: localId(),
      kind,
      status: 'sending',
      payload: null,
      target: targetOf(kind, action.expObject, action.transaction ?? null),
      txid: null,
      actionId: action.id ?? null,
      error: null,
      attempts: 1,
      createdAt: action.added ? Date.parse(action.added) || Date.now() : Date.now(),
      sentAt: null,
      settledAt: null,
    }) as TrackedTx
    // Keep the host's object: it is all there is to show a pending offer.
    tx.payload = action.expObject ?? null
    items.value.push(tx)
    return tx
  }

  /** Subscribes to host events and picks up actions still pending from before. */
  async function start(): Promise<void> {
    const sdk = session.sdk
    if (!sdk || started) return
    started = true
    sdk.on('action', onAction)
    const actions = await sdk.get.actions().catch(() => [] as HostAction[])
    for (const action of Array.isArray(actions) ? actions : []) {
      if (action.completed || action.rejected) continue
      if (!find(action)) {
        const tx = restore(action)
        if (tx) apply(tx, action)
      }
    }
  }

  async function attempt(tx: TrackedTx): Promise<TrackedTx> {
    const sdk = session.sdk
    tx.status = 'sending'
    tx.error = null
    tx.txid = null
    tx.actionId = null
    tx.sentAt = null
    tx.settledAt = null
    tx.attempts += 1
    notify(tx)

    if (!sdk) {
      tx.status = 'failed'
      tx.error = 'sdk_not_ready'
      notify(tx)
      return tx
    }
    // Banned users see their action hang forever, like in the old app.
    await hangIfBanned(session.address)

    try {
      const action = await SENDERS[tx.kind](sdk, tx.payload)
      apply(tx, action ?? {})
    } catch (error) {
      tx.status = 'failed'
      tx.error = errorText(error)
      tx.settledAt = Date.now()
    }
    notify(tx)
    return tx
  }

  /**
   * Sends a transaction through Bastyon. Resolves once the host answered:
   * `waiting` (broadcast) or `failed`. Never rejects: the status says it all.
   */
  function send(kind: TxKind, payload: unknown): Promise<TrackedTx> {
    const tx = reactive<TrackedTx>({
      id: localId(),
      kind,
      status: 'sending',
      payload,
      target: targetOf(kind, payload, null),
      txid: null,
      actionId: null,
      error: null,
      attempts: 0,
      createdAt: Date.now(),
      sentAt: null,
      settledAt: null,
    }) as TrackedTx
    items.value.push(tx)
    return attempt(tx)
  }

  /** Sends the same payload again. A restored entry without the original payload resends the host's copy. */
  function retry(id: string): Promise<TrackedTx> | null {
    const tx = items.value.find((t) => t.id === id)
    if (!tx || tx.status !== 'failed' || tx.payload === null) return null
    return attempt(tx)
  }

  function dismiss(id: string) {
    items.value = items.value.filter((t) => t.id !== id)
  }

  /** The latest transaction about an offer or address. */
  function latestFor(target: string | null | undefined, kinds?: TxKind[]): TrackedTx | undefined {
    if (!target) return undefined
    for (let i = items.value.length - 1; i >= 0; i--) {
      const tx = items.value[i]!
      if (tx.target === target && (!kinds || kinds.includes(tx.kind))) return tx
    }
    return undefined
  }

  /** My offers on their way into a block: show them in my list before the node has them. */
  const pendingOffers = computed(() =>
    items.value.flatMap((tx): { offer: Offer; tx: TrackedTx }[] => {
      if (tx.kind !== 'offer' || tx.status === 'done') return []
      const offer = offerFromAlias(tx.payload, tx.txid)
      return offer ? [{ offer: { ...offer, hash: offer.hash ?? tx.target }, tx }] : []
    })
  )

  /** Only for tests. */
  function $resetForTests() {
    items.value = []
    listeners.clear()
    started = false
  }

  return {
    items,
    pendingOffers,
    start,
    send,
    retry,
    dismiss,
    latestFor,
    subscribe,
    onAction,
    $resetForTests,
  }
})
