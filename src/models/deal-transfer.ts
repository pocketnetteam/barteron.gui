/**
 * Safe deal transfers as the node lists them, and the message each carries
 * in OP_RETURN (old `paymentTransferMessage`). Apart from `safe-deal.ts`: the
 * API and the transaction store need only this, and the rest of the deal code
 * (MD5, the guarantor list) loads with the deal screens.
 */

import { isJsonObject } from './tx'

export const paymentMessage = (id: string): string => `Safe deal ${id}`

/** The deal id back from a transfer message; `null` — not a deal transfer. */
export function dealIdFromMessage(message: unknown): string | null {
  const m = typeof message === 'string' ? message.match(/^Safe deal ([0-9a-f]{26})$/) : null
  return m ? m[1]! : null
}

export interface DealTransfer {
  txid: string
  from: string
  to: string
  /** PKOIN. */
  amount: number
  height: number
  /** ms. */
  time: number
}

/**
 * Rows of `getfromtotransactions` → transfers. The node may send one row per
 * input of the sender, so a transaction is counted once. Amounts come in
 * satoshi.
 */
export function parseTransfers(raw: unknown): DealTransfer[] {
  const rows = Array.isArray(raw) ? raw : []
  const seen = new Set<string>()
  const out: DealTransfer[] = []
  for (const row of rows) {
    if (!isJsonObject(row)) continue
    const txid = typeof row.hash === 'string' ? row.hash : ''
    const amount = Number(row.amount)
    if (!txid || seen.has(txid) || !(amount > 0)) continue
    seen.add(txid)
    out.push({
      txid,
      from: typeof row.addrFrom === 'string' ? row.addrFrom : '',
      to: typeof row.addrTo === 'string' ? row.addrTo : '',
      amount: amount / 1e8,
      height: Number(row.height) || 0,
      time: (Number(row.time) || 0) * 1000,
    })
  }
  return out
}
