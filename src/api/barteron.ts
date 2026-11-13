/**
 * Node reads Barteron uses, through `sdk.rpc` of the host. Requests and
 * parameter shapes follow the old `src/js/sdk.js`; the node side is
 * pocketnet.core `src/pocketdb/web/BarteronRpc.cpp` (argument names are
 * matched case-insensitively there, so the old camelCase names work).
 *
 * Every list goes through the ban list here, so no screen can forget it.
 */

import { isBanned, loadBanList, withoutBanned } from '@/config/ban'
import { parseAccount, type BarteronAccount } from '@/models/account'
import { parseOffer, type Offer } from '@/models/offer'
import { parseUserProfile, type UserProfile } from '@/models/profile'
import { parseReview, parseScore, type OfferScore, type Review } from '@/models/review'
import { parseTransfers, type DealTransfer } from '@/models/deal-transfer'
import { isJsonObject, TX_TYPE, type RawTx } from '@/models/tx'
import type { HostSdk } from '@/sdk/types'

export interface Pagination {
  /** Height the first page was read at: later pages stay consistent while new offers arrive. */
  topHeight?: number
  pageStart?: number
  /** The node's default is 10. */
  pageSize?: number
  orderBy?: 'height' | 'location' | 'price'
  orderDesc?: boolean
}

/** Filters shared by the feed, the groups and the deals. */
export interface OfferFilters {
  /** Offer language, `ru-RU`. Brighteon forces `en-US`. */
  lang?: string
  /** Geohash prefixes; an offer matches when its geohash starts with one of them. */
  location?: string[]
  /** Hundredths of PKOIN, like the price on chain. */
  priceMin?: number
  priceMax?: number
  /** SQL LIKE pattern over caption and description; see `searchPattern`. */
  search?: string
}

export interface FeedRequest extends OfferFilters, Pagination {
  /** Category ids, already expanded to subcategories. */
  tags?: number[]
}

export interface GroupsRequest extends FeedRequest {
  /** Geohash length to group by. */
  locationGroup: number
}

export interface OfferGroup {
  location: string
  count: number
}

/** Offers that could be exchanged for mine. */
export interface DealsRequest extends OfferFilters, Pagination {
  /** What I want: categories their offers are in. */
  theirTags: number[]
  /** What I have: categories their offers accept. */
  myTags: number[]
  addresses?: string[]
  excludeAddresses?: string[]
}

/** Three-way exchange: me → target → intermediate → me. */
export interface ComplexDealsRequest {
  myTag: number
  theirTags: number[]
  excludeAddresses?: string[]
  location?: string[]
  lang?: string
}

export interface ComplexDeal {
  target: Offer
  intermediates: Offer[]
}

export interface OfferDetailsRequest {
  offerIds: string[]
  includeAccounts?: boolean
  includeScores?: boolean
  includeComments?: boolean
  includeCommentScores?: boolean
}

export interface OfferDetails {
  scores: OfferScore[]
  reviews: Review[]
  /** Score transactions on reviews, as the node returns them. */
  commentScores: RawTx[]
  accounts: BarteronAccount[]
}

/** «велосипед» → `%велосипед%`, as the old catalog sent it. */
export const searchPattern = (text: string): string => `%${text.trim()}%`

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const isTx = (value: unknown): value is RawTx =>
  isJsonObject(value) && typeof value.hash === 'string'

const txs = (value: unknown): RawTx[] => asArray(value).filter(isTx)

function offers(value: unknown, withBanned = false): Offer[] {
  const all = txs(value)
    .filter((tx) => tx.type !== TX_TYPE.contentDelete)
    .map((tx) => parseOffer(tx))
  return withBanned ? all : withoutBanned(all)
}

export interface OfferPage {
  offers: Offer[]
  /** Offers the node sent, before the ban list: tells whether another page may follow. */
  received: number
}

const page = (value: unknown): OfferPage => ({ offers: offers(value), received: txs(value).length })

export interface BarteronApiOptions {
  /** The Brighteon build limits language and region. */
  brighteon?: boolean
  /** Turns geohash prefixes into ones inside the allowed region (Brighteon). */
  limitLocation?: (location: string[]) => string[]
  /** Told after every node request whether it answered («Нет связи с сетью»). */
  onRpc?: (answered: boolean) => void
}

export class BarteronApi {
  constructor(
    private readonly sdk: HostSdk,
    private readonly options: BarteronApiOptions = {}
  ) {}

  private async rpc<T>(method: string, parameters: unknown[]): Promise<T> {
    try {
      const result = await this.sdk.rpc<T>(method, parameters)
      this.options.onRpc?.(true)
      return result
    } catch (error) {
      this.options.onRpc?.(false)
      throw error
    }
  }

  /** The ban list loads alongside the request: results are filtered by it. */
  private async call<T>(method: string, parameters: unknown[]): Promise<T> {
    const [result] = await Promise.all([this.rpc<T>(method, parameters), loadBanList()])
    return result
  }

  /** Brighteon: English offers in Canada and the USA only (old `setupRequestForBrighteon`). */
  private scoped<T extends { lang?: string; location?: string[] }>(request: T): T | null {
    if (!this.options.brighteon) return request
    const location = this.options.limitLocation?.(request.location ?? []) ?? request.location ?? []
    if (!location.length) return null
    return { ...request, lang: 'en-US', location }
  }

  /** One page of the feed. `received` counts banned offers too: the page was full even if some were hidden. */
  async feedPage(request: FeedRequest): Promise<OfferPage> {
    const scoped = this.scoped(request)
    if (!scoped) return { offers: [], received: 0 }
    return page(await this.call('getbarteronfeed', [scoped]))
  }

  async feed(request: FeedRequest): Promise<Offer[]> {
    return (await this.feedPage(request)).offers
  }

  async groups(request: GroupsRequest): Promise<OfferGroup[]> {
    const scoped = this.scoped(request)
    if (!scoped) return []
    const result = await this.call<unknown>('getbarterongroups', [scoped])
    return asArray(result).flatMap((item): OfferGroup[] =>
      isJsonObject(item) && typeof item.location === 'string'
        ? [{ location: item.location, count: Number(item.count) || 0 }]
        : []
    )
  }

  async dealsPage(request: DealsRequest): Promise<OfferPage> {
    const scoped = this.scoped(request)
    if (!scoped) return { offers: [], received: 0 }
    return page(
      await this.call('getbarterondeals', [
        { ...scoped, myTags: scoped.myTags.map(Number), theirTags: scoped.theirTags.map(Number) },
      ])
    )
  }

  async deals(request: DealsRequest): Promise<Offer[]> {
    return (await this.dealsPage(request)).offers
  }

  async complexDeals(request: ComplexDealsRequest): Promise<ComplexDeal[]> {
    const scoped = this.scoped(request)
    if (!scoped) return []
    const result = await this.call<unknown>('getbarteroncomplexdeals', [
      { ...scoped, myTag: Number(scoped.myTag), theirTags: scoped.theirTags.map(Number) },
    ])
    return asArray(result).flatMap((item): ComplexDeal[] => {
      if (!isJsonObject(item) || !isTx(item.target)) return []
      const target = parseOffer(item.target)
      const intermediates = txs(item.intermediates).map((tx) => parseOffer(tx))
      if ([target, ...intermediates].some((o) => isBanned(o.address))) return []
      return [{ target, intermediates }]
    })
  }

  async offersByAddress(address: string): Promise<Offer[]> {
    if (!address) return []
    return offers(await this.call('getbarteronoffersbyaddress', [address]))
  }

  /**
   * Latest versions of offers by their ids, in the order asked. `withBanned`
   * — for safe deals only: a seller banned in the middle of a deal must not
   * leave the guarantor with the buyer's money and no page (the old deal page
   * did not filter either).
   */
  async offersByIds(ids: readonly string[], { withBanned = false } = {}): Promise<Offer[]> {
    if (!ids.length) return []
    const found = offers(await this.call('getbarteronoffersbyroottxhashes', [ids]), withBanned)
    const position = new Map(ids.map((id, i) => [id, i]))
    return found.sort(
      (a, b) => (position.get(a.hash ?? '') ?? Infinity) - (position.get(b.hash ?? '') ?? Infinity)
    )
  }

  async offerDetails(request: OfferDetailsRequest): Promise<OfferDetails> {
    const empty: OfferDetails = { scores: [], reviews: [], commentScores: [], accounts: [] }
    if (!request.offerIds.length) return empty
    const result = await this.call<unknown>('getbarteronoffersdetails', [
      {
        includeAccounts: true,
        includeScores: true,
        includeComments: true,
        includeCommentScores: true,
        ...request,
      },
    ])
    if (!isJsonObject(result)) return empty
    return {
      scores: txs(result.offerScores)
        .map((tx) => parseScore(tx))
        .filter((s): s is OfferScore => !!s),
      reviews: txs(result.comments)
        .map((tx) => parseReview(tx))
        .filter((r): r is Review => !!r && !isBanned(r.address))
        .sort((a, b) => a.time - b.time),
      commentScores: txs(result.commentScores),
      accounts: txs(result.accounts).map((tx) => parseAccount(tx)),
    }
  }

  /** Barteron profiles; an address without one is simply missing from the answer. */
  async accounts(addresses: readonly string[]): Promise<BarteronAccount[]> {
    if (!addresses.length) return []
    return txs(await this.call('getbarteronaccounts', [addresses])).map((tx) => parseAccount(tx))
  }

  /** Bastyon names and avatars (short form, like bastyon-nextgen asks). */
  async userProfiles(addresses: readonly string[]): Promise<UserProfile[]> {
    if (!addresses.length) return []
    const result = await this.call<unknown>('getuserprofile', [addresses, '1'])
    return asArray(result).flatMap((raw) => {
      const profile = isJsonObject(raw) ? parseUserProfile(raw) : null
      return profile ? [profile] : []
    })
  }

  /**
   * Transfers `from` → `to` with exactly this OP_RETURN script, from the
   * height given. The node lists only transfers already in a block
   * (pocketnet.core ExplorerRepository::GetFromToTransactions). Asked with
   * `sdk.rpc`: the host action `get.fromToTransactions` of bastyon-nextgen
   * refuses a script (HOST-TASKS.md, item 6).
   */
  async transfers(
    from: string,
    to: string,
    opReturn: string,
    fromHeight: number
  ): Promise<DealTransfer[]> {
    const rows = await this.rpc('getfromtotransactions', [from, to, fromHeight, opReturn])
    return parseTransfers(rows, { from, to, opReturn })
  }

  /** Height of the last block (`getnodeinfo`). */
  async chainHeight(): Promise<number> {
    const info = await this.rpc<unknown>('getnodeinfo', [])
    const body = isJsonObject(info) && isJsonObject(info.data) ? info.data : info
    const block = isJsonObject(body) ? body.lastblock : null
    const height = isJsonObject(block) ? Number(block.height) : NaN
    if (!(height > 0)) throw new Error('getnodeinfo: no height')
    return height
  }
}
