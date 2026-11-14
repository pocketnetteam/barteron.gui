import { defineStore } from 'pinia'
import { computed } from 'vue'
import { isJsonObject, isTxid } from '@/models/tx'
import { isDealId, PAYMENT_WAIT_MS, type DealParams, type DealStatus } from '@/models/safe-deal'
import { useUserStored } from './stored'

/** A deal I opened or started on this device. */
export interface StoredDeal extends DealParams {
  /** When it first came to this device, ms. */
  savedAt: number
}

/**
 * A transfer I made in a deal, under the old key `<address>_safeDeal`
 * (barteron.gui `src/stores/safeDeal.js`): `{[id]: {currentStatus,
 * timestamp, transaction}}`. Both versions write and read it on the same
 * origin, so «ждём блок» after a transfer holds in either.
 */
export interface SentTransfer {
  /** The status the deal had when I paid. */
  currentStatus: string
  timestamp: number
  transaction: string | null
}

const KEYS: (keyof DealParams)[] = ['id', 'offer', 'buyer', 'validator', 'fee']

/**
 * The list keeps this many, the newest. Each deal costs three node requests
 * on «Сделки»; an older one still opens from its link in the chat.
 */
export const MAX_STORED_DEALS = 100

function storedDeal(v: unknown): StoredDeal | null {
  if (!isJsonObject(v) || !KEYS.every((k) => typeof v[k] === 'string' && v[k])) return null
  const deal = Object.fromEntries(KEYS.map((k) => [k, v[k]])) as Record<keyof DealParams, string>
  // A record that could never open: it would hang in the list and go to the node every time.
  if (!isDealId(deal.id) || !isTxid(deal.offer)) return null
  return { ...deal, savedAt: typeof v.savedAt === 'number' ? v.savedAt : 0 }
}

function dealList(value: unknown): StoredDeal[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const deals = value.flatMap((v): StoredDeal[] => {
    const deal = storedDeal(v)
    if (!deal || seen.has(deal.id)) return []
    seen.add(deal.id)
    return [deal]
  })
  return deals.sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_STORED_DEALS)
}

function sentMap(value: unknown): Record<string, SentTransfer> {
  if (!isJsonObject(value)) return {}
  const out: Record<string, SentTransfer> = {}
  for (const [id, v] of Object.entries(value)) {
    if (!isJsonObject(v) || typeof v.timestamp !== 'number') continue
    out[id] = {
      currentStatus: String(v.currentStatus ?? ''),
      timestamp: v.timestamp,
      transaction: typeof v.transaction === 'string' ? v.transaction : null,
    }
  }
  return out
}

/**
 * «Сделки» in the cabinet (new): the deals I started or opened by a link on
 * this device, under the new key `<address>_deals`, newest first. The chain
 * cannot list them: transfers are found by the exact OP_RETURN only, and the
 * id is random (PLAN.md, stage 8).
 */
export const useDealsStore = defineStore('deals', () => {
  const stored = useUserStored<StoredDeal[]>('deals', [], dealList)
  const sent = useUserStored<Record<string, SentTransfer>>('safeDeal', {}, sentMap)

  const list = computed(() => [...stored.value.value].sort((a, b) => b.savedAt - a.savedAt))

  function remember(deal: DealParams, now = Date.now()) {
    if (stored.value.value.some((d) => d.id === deal.id)) return
    const entry = storedDeal({ ...deal, savedAt: now })
    if (entry) stored.set(dealList([entry, ...stored.value.value]))
  }

  function forget(id: string) {
    stored.set(stored.value.value.filter((d) => d.id !== id))
  }

  /**
   * After my transfer has gone: the old page wrote the same. Records past the
   * wait go: neither version reads them, and a deal that never finished would
   * keep its record for good.
   */
  function markSent(id: string, status: DealStatus, transaction: string | null, now = Date.now()) {
    const live = Object.entries(sent.value.value).filter(
      ([, r]) => now - r.timestamp < PAYMENT_WAIT_MS
    )
    sent.set({
      ...Object.fromEntries(live),
      [id]: { currentStatus: status, timestamp: now, transaction },
    })
  }

  /** The deal has finished: the old page dropped its record too. */
  function clearSent(id: string) {
    if (!(id in sent.value.value)) return
    const next = { ...sent.value.value }
    delete next[id]
    sent.set(next)
  }

  /**
   * My transfer is on its way: sent at this status less than 20 minutes ago
   * (old `checkPaymentStatus`).
   */
  function sentAt(id: string, status: DealStatus, now = Date.now()): SentTransfer | null {
    const record = sent.value.value[id]
    return record && record.currentStatus === status && now - record.timestamp < PAYMENT_WAIT_MS
      ? record
      : null
  }

  return { list, remember, forget, markSent, clearSent, sentAt }
})
