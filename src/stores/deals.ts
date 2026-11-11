import { defineStore } from 'pinia'
import { computed } from 'vue'
import { isJsonObject } from '@/models/tx'
import { PAYMENT_WAIT_MS, type DealParams, type DealStatus } from '@/models/safe-deal'
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

function dealList(value: unknown): StoredDeal[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value.flatMap((v): StoredDeal[] => {
    if (!isJsonObject(v) || !KEYS.every((k) => typeof v[k] === 'string' && v[k])) return []
    if (seen.has(v.id as string)) return []
    seen.add(v.id as string)
    const deal = Object.fromEntries(KEYS.map((k) => [k, v[k]])) as unknown as DealParams
    return [{ ...deal, savedAt: typeof v.savedAt === 'number' ? v.savedAt : 0 }]
  })
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
    const entry = Object.fromEntries(KEYS.map((k) => [k, deal[k]])) as unknown as DealParams
    stored.set([{ ...entry, savedAt: now }, ...stored.value.value])
  }

  function forget(id: string) {
    stored.set(stored.value.value.filter((d) => d.id !== id))
  }

  /** After my transfer has gone: the old page wrote the same. */
  function markSent(id: string, status: DealStatus, transaction: string | null, now = Date.now()) {
    sent.set({ ...sent.value.value, [id]: { currentStatus: status, timestamp: now, transaction } })
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
