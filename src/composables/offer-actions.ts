import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useCategories } from '@/api/queries'
import {
  offerFromAlias,
  toOfferPayload,
  withPublication,
  type Offer,
  type OfferPublication,
} from '@/models/offer'
import { useTxStore, type TrackedTx } from '@/stores/tx'

/**
 * What is happening to an offer on its way to the chain, for the status line
 * and the right column (s3-item-states):
 * - `publishing` — a new offer or a renewal;
 * - `updating` — a change of a published offer («Изменения публикуются»);
 * - `withdrawing` / `removing`;
 * - `failed` — the node refused; the payload is kept for a retry.
 */
export type OfferOperation =
  | { kind: 'publishing' | 'updating' | 'withdrawing' | 'removing'; tx: TrackedTx }
  | { kind: 'failed'; tx: TrackedTx; action: 'publish' | 'withdraw' | 'remove' }

function publicationOf(tx: TrackedTx): OfferPublication | null {
  const payload = tx.payload as { published?: OfferPublication } | null
  return payload?.published ?? null
}

export function operationOf(
  tx: TrackedTx | undefined,
  offer: Pick<Offer, 'published'> | null
): OfferOperation | null {
  if (!tx || tx.status === 'done') return null
  const action =
    tx.kind === 'offerRemove'
      ? 'remove'
      : publicationOf(tx) === 'withdrawed'
        ? 'withdraw'
        : 'publish'
  if (tx.status === 'failed') return { kind: 'failed', tx, action }
  if (action === 'remove') return { kind: 'removing', tx }
  if (action === 'withdraw') return { kind: 'withdrawing', tx }
  return { kind: offer?.published === 'published' ? 'updating' : 'publishing', tx }
}

/**
 * Withdraw, renew and delete my offer (old main.js:424-508). Withdrawing and
 * renewing send the whole offer again with another `published`; deleting is
 * `removeOffer`. Each is one transaction with its own network status.
 */
export function useOfferActions(offer: MaybeRefOrGetter<Offer | null | undefined>) {
  const tx = useTxStore()
  const categories = useCategories()

  const latest = computed(() => {
    const o = toValue(offer)
    return o?.hash ? tx.latestFor(o.hash, ['offer', 'offerRemove']) : undefined
  })
  const operation = computed(() => operationOf(latest.value, toValue(offer) ?? null))
  /** A transaction is on its way: other actions wait for it. */
  const busy = computed(
    () => !!latest.value && (latest.value.status === 'sending' || latest.value.status === 'waiting')
  )
  /** The version on its way, to show instead of the node's (e.g. a lower price). */
  const pendingVersion = computed(() => {
    const t = latest.value
    if (!t || t.kind !== 'offer' || t.status === 'done') return null
    return offerFromAlias(t.payload, t.txid)
  })

  /** Renewing needs a leaf category: the old app asked to pick a narrower one first. */
  const canRenew = computed(() => {
    const o = toValue(offer)
    const tree = categories.tree.value
    return !!o?.tag && (!tree || tree.isLeaf(o.tag))
  })

  function sendVersion(published: OfferPublication, leafCheck: boolean) {
    const o = toValue(offer)
    if (!o?.hash) return null
    const tree = categories.tree.value
    const payload = toOfferPayload(
      withPublication(o, published),
      leafCheck && tree ? { isLeafCategory: (id) => tree.isLeaf(id) } : {}
    )
    return tx.send('offer', payload)
  }

  return {
    operation,
    busy,
    pendingVersion,
    canRenew,
    withdraw: () => sendVersion('withdrawed', false),
    renew: () => sendVersion('published', true),
    remove: () => {
      const hash = toValue(offer)?.hash
      return hash ? tx.send('offerRemove', { hash }) : null
    },
    retry: () => (latest.value ? tx.retry(latest.value.id) : null),
  }
}
