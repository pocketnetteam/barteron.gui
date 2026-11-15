import { describe, expect, it } from 'vitest'
import { BarteronApi } from '@/api/barteron'
import { parseVideoInfo } from '@/components/item/gallery'
import { txErrorKey } from '@/lib/tx-errors'
import { parseUserProfile } from '@/models/profile'
import { errorText } from '@/stores/tx'
import LIVE from '@/test/mainnet-rpc.json'
import { createMockSdk, MOCK_ADDRESS } from './mock'
import { demoNetworkData } from './mock-data'
import { createMockNetwork } from './mock-network'

/*
 * The SDK mock answers in the shape mainnet does (src/test/mainnet-rpc.json,
 * read through our own bastyon-nextgen): e2e and these tests run against
 * the mock, so a field it lacks is a field nobody tests.
 */

type Kinds = Map<string, Set<string>>
const kind = (v: unknown) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v)

/** Every path of a value with the kinds seen there; array items merged under `[]`. */
function shape(value: unknown, path = '', into: Kinds = new Map()): Kinds {
  into.set(path || '.', (into.get(path || '.') ?? new Set()).add(kind(value)))
  if (Array.isArray(value)) for (const item of value) shape(item, `${path}[]`, into)
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) shape(v, `${path}.${k}`, into)
  return into
}

/** What mainnet has and the mock does not, or has as another type. */
function missing(live: unknown, mock: unknown, ignore: RegExp = /\.blockHash$/): string[] {
  const a = shape(live)
  const b = shape(mock)
  const out: string[] = []
  for (const [path, kinds] of a) {
    if (ignore.test(path)) continue
    const other = b.get(path)
    if (!other) {
      out.push(`${path}: missing`)
      continue
    }
    const real = (s: Set<string>) => [...s].filter((k) => k !== 'null')
    if (real(kinds).some((k) => real(other).length && !real(other).includes(k)))
      out.push(`${path}: ${[...kinds]} vs ${[...other]}`)
  }
  return out
}

function mock() {
  const data = demoNetworkData(MOCK_ADDRESS)
  const sdk = createMockSdk({ network: createMockNetwork(data) })
  const rpc = (method: string, parameters: unknown[]) => sdk.rpc(method, parameters, {})
  return { sdk, rpc, data }
}

describe('the mock answers node reads in the shape mainnet does', () => {
  it('offers: the feed, exchanges, by author, by id', async () => {
    const { rpc } = mock()
    const feed = (await rpc('getbarteronfeed', [{ pageSize: 50 }])) as { s1: string; s2: string }[]
    // Every key a mainnet row has, inside `p` too (s7 — a video — included).
    expect(missing(LIVE.rpc.getbarteronfeed, feed)).toEqual([])
    expect(
      missing(
        LIVE.rpc.getbarterondeals,
        await rpc('getbarterondeals', [{ myTags: [17], theirTags: [1006] }])
      )
    ).toEqual([])
    expect(
      missing(
        LIVE.rpc.getbarteronoffersbyaddress,
        await rpc('getbarteronoffersbyaddress', [feed[0]!.s1])
      )
    ).toEqual([])
    expect(
      missing(
        LIVE.rpc.getbarteronoffersbyroottxhashes,
        await rpc('getbarteronoffersbyroottxhashes', [[feed[0]!.s2]])
      )
    ).toEqual([])
  })

  it('counts by area', async () => {
    const { rpc } = mock()
    expect(
      missing(LIVE.rpc.getbarterongroups, await rpc('getbarterongroups', [{ locationGroup: 4 }]))
    ).toEqual([])
  })

  it('details of an offer: scores, reviews, their authors', async () => {
    const { rpc, data } = mock()
    // A demo offer with reviews and scores.
    const reviewed = data.comments!.map((c) => c.s3!)[0]!
    const details = await rpc('getbarteronoffersdetails', [
      {
        offerIds: [reviewed],
        includeAccounts: true,
        includeScores: true,
        includeComments: true,
        includeCommentScores: true,
      },
    ])
    expect(missing(LIVE.rpc.getbarteronoffersdetails, details)).toEqual([])
  })

  it('Barteron profiles and Bastyon ones', async () => {
    const { rpc, data } = mock()
    const addresses = data.accounts!.map((a) => a.s1!)
    expect(
      missing(LIVE.rpc.getbarteronaccounts, await rpc('getbarteronaccounts', [addresses]))
    ).toEqual([])
    // A Bastyon profile: the fields the app reads, as mainnet sends them.
    const [live] = LIVE.rpc.getuserprofile
    const [row] = (await rpc('getuserprofile', [[MOCK_ADDRESS], '1'])) as object[]
    // Language and «about» are read too, but no screen shows them.
    const read = ['address', 'name', 'i', 'regdate', 'reputation']
    const pick = (o: object) =>
      Object.fromEntries(Object.entries(o).filter(([k]) => read.includes(k)))
    expect(missing(pick(live!), pick(row!))).toEqual([])
    expect(parseUserProfile(live!)).toMatchObject({ address: live!.address, name: live!.name })
  })

  it('transfers of a safe deal and the chain height', async () => {
    const { rpc, data } = mock()
    const t = data.transfers![0]!
    const rows = await rpc('getfromtotransactions', [t.addrFrom, t.addrTo, 0, t.opreturn])
    expect(missing(LIVE.rpc.getfromtotransactions, rows)).toEqual([])
    const api = new BarteronApi(createMockSdk({ rpc: { getnodeinfo: () => LIVE.rpc.getnodeinfo } }))
    expect(await api.chainHeight()).toBe(LIVE.rpc.getnodeinfo.lastblock.height)
  })
})

describe('host answers and failures, as the app gets them', () => {
  it('a video: ready, with its playlist, poster and length', () => {
    expect(parseVideoInfo(LIVE.host.videos)).toMatchObject({
      status: 'ready',
      playlist: LIVE.host.videos[0]!.data.original.streamingPlaylists[0]!.playlistUrl,
      poster: LIVE.host.videos[0]!.data.thumbnail,
    })
  })

  it('appinfo: the mock has every field mainnet sends and the app reads', async () => {
    const { sdk } = mock()
    const info = await sdk.get.appinfo()
    // The scope is the manifest's; the host's version and old PeerTube servers are not read.
    const notRead = /\.application\.scope$|^\.version$|archivedPeertubeServers\[\]$/
    expect(missing(LIVE.host.appinfo, info, notRead)).toEqual([])
  })

  it('signed out, an unknown method, broken parameters: in words', () => {
    expect(txErrorKey(errorText(LIVE.errors.signedOut))).toBe('signIn')
    expect(errorText(LIVE.errors.unknownMethod)).toMatch(/RPC servers failed/)
    expect(errorText(LIVE.errors.brokenParameters)).toBe('unknown error')
  })
})
