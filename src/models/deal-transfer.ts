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

/** What the deal asked the node for: who sent, to whom, which OP_RETURN script. */
export interface TransferQuery {
  from: string
  to: string
  /** Hex of the script, as `opReturnHex` gives it. */
  opReturn: string
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '')

/**
 * Rows of `getfromtotransactions` → transfers. Amounts come in satoshi: what
 * `to` got, change aside. On mainnet a transfer with 4–6 inputs came as one
 * row (13.11.2026); a repeated hash is still counted once.
 *
 * Only rows that are exactly what was asked count: the node takes an empty
 * address for «anyone», and a host that loses the script gets its default
 * label (`a:subscription`) instead. A row without a block is not a transfer
 * yet: the old host dropped such rows too (`currentBlock - height`).
 */
export function parseTransfers(raw: unknown, query: TransferQuery): DealTransfer[] {
  const rows = Array.isArray(raw) ? raw : []
  const script = query.opReturn.toLowerCase()
  const seen = new Set<string>()
  const out: DealTransfer[] = []
  for (const row of rows) {
    if (!isJsonObject(row)) continue
    const txid = str(row.hash)
    const amount = Number(row.amount)
    const height = Number(row.height)
    if (!txid || seen.has(txid) || !(amount > 0) || !(height > 0)) continue
    if (row.addrFrom !== query.from || row.addrTo !== query.to) continue
    if (str(row.opreturn).toLowerCase() !== script) continue
    seen.add(txid)
    out.push({
      txid,
      from: query.from,
      to: query.to,
      amount: amount / 1e8,
      height,
      time: (Number(row.time) || 0) * 1000,
    })
  }
  return out
}
