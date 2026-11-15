/**
 * In-memory Barteron network for the mock SDK: answers the node reads and
 * plays the host's part for writes — broadcast, then a block a few seconds
 * later, then the `action` event. Only for dev and tests; it never touches
 * the real network.
 *
 * Magic for trying failures by hand: a caption or review that starts with
 * `!reject` never makes it into a block; `!error` is refused at once.
 */

import { opReturnHex } from '@/models/safe-deal'
import { isJsonObject, TX_TYPE, type JsonObject, type RawTx } from '@/models/tx'
import type { HostAction } from './types'

export type MockWrite = 'offer' | 'removeOffer' | 'account' | 'comment' | 'vote' | 'payment'

/** A PKOIN transfer as `getfromtotransactions` lists it. */
export interface MockTransfer {
  addrFrom: string
  addrTo: string
  hash: string
  height: number
  /** Satoshi. */
  amount: number
  /** Seconds. */
  time: number
  /** OP_RETURN script, hex. */
  opreturn: string
}

export interface MockNetworkData {
  offers?: RawTx[]
  accounts?: (RawTx & { additional?: JsonObject })[]
  profiles?: JsonObject[]
  scores?: RawTx[]
  comments?: RawTx[]
  transfers?: MockTransfer[]
}

export interface MockNetworkOptions extends MockNetworkData {
  /** Current block height. */
  height?: number
  /** A new empty block this often, ms; 0 — blocks come only with writes. */
  blockMs?: number
  /** Time to broadcast, ms. */
  broadcastMs?: number
  /** Time to the block, ms. */
  confirmMs?: number
  now?: () => number
}

export interface MockNetwork {
  rpc: Record<string, (parameters: unknown[]) => unknown>
  send(kind: MockWrite, data: unknown, address: string): Promise<HostAction>
  /** Like the host, tells every open app about blocks: a reloaded page gets them too. */
  subscribe(listener: (action: HostAction) => void): () => void
  /** Pending and recent actions, like the host's `getactions`. */
  actions(): HostAction[]
  readonly height: number
}

const obj = (v: unknown): JsonObject => (isJsonObject(v) ? v : {})
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const text = (v: unknown): string => (typeof v === 'string' ? v : '')

const randomHex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')

function offerJson(tx: RawTx): JsonObject {
  try {
    return obj(JSON.parse(tx.p?.s4 ?? '{}'))
  } catch {
    return {}
  }
}

const likePattern = (pattern: string) => pattern.replace(/^%|%$/g, '').toLowerCase()

/** Demo chain height: above the first safe deal block (3 466 240), below mainnet today. */
export const MOCK_HEIGHT = 4_000_000

export function createMockNetwork(options: MockNetworkOptions = {}): MockNetwork {
  const now = options.now ?? Date.now
  let height = options.height ?? MOCK_HEIGHT
  const broadcastMs = options.broadcastMs ?? 400
  const confirmMs = options.confirmMs ?? 4000
  const blockMs = options.blockMs ?? 0
  let lastBlockAt = now()
  /** Empty blocks that came since the last look. */
  function tick() {
    if (!blockMs) return
    const blocks = Math.floor((now() - lastBlockAt) / blockMs)
    if (blocks > 0) {
      height += blocks
      lastBlockAt += blocks * blockMs
    }
  }
  const transfers = [...(options.transfers ?? [])]

  /** Latest version by offer id. */
  const offers = new Map<string, RawTx>()
  for (const tx of options.offers ?? []) offers.set(tx.s2 || tx.hash, tx)
  const accounts = new Map<string, RawTx & { additional?: JsonObject }>()
  for (const tx of options.accounts ?? []) if (tx.s1) accounts.set(tx.s1, tx)
  const profiles = new Map<string, JsonObject>()
  for (const p of options.profiles ?? []) profiles.set(text(p.address), p)
  const scores = [...(options.scores ?? [])]
  const comments = [...(options.comments ?? [])]
  const actions: HostAction[] = []
  const subscribers = new Set<(action: HostAction) => void>()

  const year = 365 * 24 * 3600
  const isActive = (tx: RawTx) => {
    if (tx.type !== TX_TYPE.offer) return false
    const p = offerJson(tx).p
    return (p === undefined || p === 'published') && tx.time + year > now() / 1000
  }

  const sellerTags = (address: string) =>
    list(offerJson(accounts.get(address) ?? ({} as RawTx)).a).map(Number)

  /** Tags an offer accepts, with «my list» resolved. */
  const accepts = (tx: RawTx): number[] => {
    const a = list(offerJson(tx).a)
    if (a.includes('my_list')) return sellerTags(text(tx.s1))
    return a.map(Number).filter(Number.isFinite)
  }

  function paginate(items: RawTx[], request: JsonObject): RawTx[] {
    const orderBy = text(request.orderBy) || 'height'
    const desc = request.orderDesc !== false
    const top = typeof request.topHeight === 'number' ? request.topHeight : Infinity
    const sorted = items
      .filter((tx) => (tx.height ?? 0) <= top)
      .sort((a, b) => {
        const d =
          orderBy === 'price'
            ? (a.p?.i1 ?? 0) - (b.p?.i1 ?? 0)
            : orderBy === 'location'
              ? (a.p?.s6 ?? '').localeCompare(b.p?.s6 ?? '')
              : (a.height ?? 0) - (b.height ?? 0)
        return desc ? -d : d
      })
    const size = typeof request.pageSize === 'number' ? request.pageSize : 10
    const start = typeof request.pageStart === 'number' ? request.pageStart : 0
    return sorted.slice(start * size, start * size + size)
  }

  /**
   * Offers a request matches. `asNode`: like the feed and the counts of the
   * real node, withdrawn and expired offers come too — its SQL has no status
   * filter (checked on mainnet, stage 10); the app hides them itself.
   */
  function filtered(request: JsonObject, asNode = false): RawTx[] {
    const lang = text(request.lang)
    const tags = list(request.tags).map(Number)
    const location = list(request.location).map(text)
    const search = request.search ? likePattern(text(request.search)) : ''
    const min = typeof request.priceMin === 'number' ? request.priceMin : null
    const max = typeof request.priceMax === 'number' ? request.priceMax : null
    return [...offers.values()].filter((tx) => {
      if (asNode ? tx.type !== TX_TYPE.offer : !isActive(tx)) return false
      const price = tx.p?.i1 ?? 0
      const geohash = tx.p?.s6 ?? ''
      if (lang && tx.p?.s1 !== lang) return false
      if (tags.length && !tags.includes(Number(offerJson(tx).t))) return false
      if (location.length && !location.some((l) => geohash.startsWith(l))) return false
      if (min !== null && min > 0 && price < min) return false
      if (max !== null && max > 0 && price > max) return false
      if (search) {
        const hay = `${tx.p?.s2 ?? ''} ${tx.p?.s3 ?? ''}`.toLowerCase()
        if (!hay.includes(search)) return false
      }
      return true
    })
  }

  const withAdditional = (tx: RawTx & { additional?: JsonObject }) => ({
    ...tx,
    additional: tx.additional ?? { regdate: tx.time, rating: 0, rating_sum: 0, rating_count: 0 },
  })

  const rpc: MockNetwork['rpc'] = {
    getbarteronfeed: ([request]) => paginate(filtered(obj(request), true), obj(request)),

    getbarterongroups: ([request]) => {
      const r = obj(request)
      // The node's default; the old client never asked, so nothing relied on another.
      const size = typeof r.locationGroup === 'number' ? r.locationGroup : 1
      const counts = new Map<string, number>()
      for (const tx of filtered(r, true)) {
        const key = (tx.p?.s6 ?? '').slice(0, size)
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      return [...counts].map(([location, count]) => ({ location, count }))
    },

    getbarterondeals: ([request]) => {
      const r = obj(request)
      const their = list(r.theirTags ?? r.theirtags).map(Number)
      const mine = list(r.myTags ?? r.mytags).map(Number)
      const exclude = list(r.excludeAddresses ?? r.excludeaddresses).map(text)
      const only = list(r.addresses).map(text)
      const items = filtered({ ...r, tags: [] }).filter((tx) => {
        const author = text(tx.s1)
        if (exclude.includes(author) || (only.length && !only.includes(author))) return false
        if (their.length && !their.includes(Number(offerJson(tx).t))) return false
        return !mine.length || accepts(tx).some((t) => mine.includes(t))
      })
      return paginate(items, r)
    },

    getbarteroncomplexdeals: ([request]) => {
      const r = obj(request)
      const myTag = Number(r.myTag ?? r.mytag)
      const their = list(r.theirTags ?? r.theirtags).map(Number)
      const exclude = list(r.excludeAddresses ?? r.excludeaddresses).map(text)
      const active = [...offers.values()].filter(
        (tx) => isActive(tx) && !exclude.includes(text(tx.s1))
      )
      return active
        .filter((target) => their.includes(Number(offerJson(target).t)))
        .flatMap((target) => {
          const wanted = accepts(target)
          const intermediates = active.filter(
            (o) =>
              o !== target &&
              o.s1 !== target.s1 &&
              wanted.includes(Number(offerJson(o).t)) &&
              accepts(o).includes(myTag)
          )
          return intermediates.length ? [{ target, intermediates: intermediates.slice(0, 1) }] : []
        })
    },

    getbarteronoffersbyaddress: ([address]) =>
      [...offers.values()].filter((tx) => tx.s1 === address && tx.type === TX_TYPE.offer),

    getbarteronoffersbyroottxhashes: ([hashes]) =>
      list(hashes).flatMap((h) => (offers.has(text(h)) ? [offers.get(text(h))!] : [])),

    getbarteronoffersdetails: ([request]) => {
      const r = obj(request)
      const ids = list(r.offerIds ?? r.offerids).map(text)
      const result: JsonObject = {}
      const offerScores = scores.filter((s) => ids.includes(text(s.s2)))
      const offerComments = comments.filter((c) => ids.includes(text(c.s3)))
      if (r.includeScores !== false) result.offerScores = offerScores
      if (r.includeComments !== false) result.comments = offerComments
      if (r.includeComments !== false && r.includeCommentScores !== false) result.commentScores = []
      if (r.includeAccounts !== false) {
        const addresses = new Set(
          [...offerScores, ...offerComments, ...ids.map((id) => offers.get(id))].map((t) =>
            text(t?.s1)
          )
        )
        result.accounts = [...addresses].flatMap((a) =>
          accounts.has(a) ? [withAdditional(accounts.get(a)!)] : []
        )
      }
      return result
    },

    getbarteronaccounts: ([addresses]) =>
      list(addresses).flatMap((a) =>
        accounts.has(text(a)) ? [withAdditional(accounts.get(text(a))!)] : []
      ),

    getuserprofile: ([addresses]) =>
      list(addresses).flatMap((a) => (profiles.has(text(a)) ? [profiles.get(text(a))!] : [])),

    // Like ExplorerRepository::GetFromToTransactions: by exact OP_RETURN, an
    // empty address is anyone, from the height given, blocks only.
    getfromtotransactions: ([from, to, depth, opreturn]) => {
      const scripts = Array.isArray(opreturn) ? opreturn.map(text) : [text(opreturn)]
      const min = typeof depth === 'number' ? depth : 0
      return (
        transfers
          .filter(
            (t) =>
              scripts.includes(t.opreturn) &&
              (!text(from) || t.addrFrom === from) &&
              (!text(to) || t.addrTo === to) &&
              t.height >= min
          )
          // Mainnet rows carry the transaction type too: 1, a plain transfer.
          .map((t) => ({ ...t, type: 1 }))
      )
    },

    getnodeinfo: () => {
      tick()
      return { lastblock: { height } }
    },
  }

  /** Puts a confirmed write into the chain. */
  function apply(kind: MockWrite, data: JsonObject, address: string, txid: string) {
    tick()
    height += 1
    const time = Math.floor(now() / 1000)
    const base = { hash: txid, time, height, blockHash: randomHex(64) }
    if (kind === 'offer') {
      const root = typeof data.hash === 'string' && data.hash.length === 64 ? data.hash : txid
      offers.set(root, {
        ...base,
        type: TX_TYPE.offer,
        s1: address,
        s2: root,
        p: {
          s1: text(data.language),
          s2: text(data.caption),
          s3: text(data.description),
          s4: JSON.stringify({
            t: data.tag,
            a: data.tags,
            c: data.condition,
            p: data.published,
            f: data.currencyPrice,
            d: data.delivery,
            v: data.videoSettings,
            s: data.safeDeal,
            m: data.metaData,
          }),
          s5: JSON.stringify(data.images ?? []),
          s6: text(data.geohash),
          s7: text(data.video),
          i1: typeof data.price === 'number' ? data.price : 0,
        },
      })
    } else if (kind === 'removeOffer') {
      const root = text(data.hash)
      offers.set(root, { ...base, type: TX_TYPE.contentDelete, s1: address, s2: root })
    } else if (kind === 'account') {
      const previous = accounts.get(address)
      accounts.set(address, {
        ...base,
        type: TX_TYPE.account,
        s1: address,
        p: {
          s4: JSON.stringify({
            a: data.tags,
            g: data.geohash,
            s: data.static,
            r: data.radius,
            d: data.safeDeal,
            m: data.metaData,
          }),
        },
        additional: previous?.additional ?? {
          regdate: time,
          rating: 0,
          rating_sum: 0,
          rating_count: 0,
        },
      })
    } else if (kind === 'comment') {
      const msg = obj(data.msgparsed)
      comments.push({
        ...base,
        type: TX_TYPE.comment,
        s1: address,
        s2: txid,
        s3: text(data.postid),
        p: {
          s1: JSON.stringify({
            message: text(msg.message),
            url: '',
            images: [],
            info: text(msg.info),
          }),
        },
      })
    } else if (kind === 'vote') {
      scores.push({
        ...base,
        type: TX_TYPE.score,
        s1: address,
        s2: text(data.share),
        i1: Number(data.value),
      })
    } else if (kind === 'payment') {
      // The message goes into OP_RETURN, as the wallet writes it.
      const message = text(data.message)
      for (const r of list(data.recievers).map(obj)) {
        transfers.push({
          addrFrom: address,
          addrTo: text(r.address),
          hash: txid,
          height,
          amount: Math.round(Number(r.amount) * 1e8),
          time,
          opreturn: message ? opReturnHex(message) : '',
        })
      }
    }
  }

  const magic = (data: JsonObject): string =>
    text(data.caption) || text(obj(data.msgparsed).message)

  async function send(kind: MockWrite, raw: unknown, address: string): Promise<HostAction> {
    const data = obj(raw)
    await new Promise((r) => setTimeout(r, broadcastMs))
    if (magic(data).startsWith('!error')) throw new Error('mock: not enough PKOIN for the fee')
    const txid = randomHex(64)
    const action: HostAction = {
      id: randomHex(32),
      transaction: txid,
      completed: false,
      rejected: null,
      added: new Date(now()).toISOString(),
      sent: new Date(now()).toISOString(),
      updated: null,
      expObject:
        kind === 'removeOffer'
          ? { txidEdit: data.hash, type: 'contentDelete' }
          : kind === 'payment'
            ? // As bastyon-nextgen records a transfer (tx/app-actions).
              { type: 'transaction', source: [address], ...data }
            : data,
    }
    actions.push(action)
    setTimeout(() => {
      if (magic(data).startsWith('!reject')) {
        action.rejected = 'notconfirmed'
      } else {
        apply(kind, data, address, txid)
        action.completed = true
      }
      action.updated = new Date(now()).toISOString()
      subscribers.forEach((listener) => listener({ ...action }))
    }, confirmMs)
    return { ...action }
  }

  return {
    rpc,
    send,
    subscribe(listener) {
      subscribers.add(listener)
      return () => subscribers.delete(listener)
    },
    actions: () => actions.map((a) => ({ ...a })),
    get height() {
      tick()
      return height
    },
  }
}
