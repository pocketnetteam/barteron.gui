import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { markRaw } from 'vue'
import { QueryClient } from '@tanstack/vue-query'
import { keys, refreshAfterTx } from '@/api/queries'
import { BAN_LIST } from '@/config/ban-list'
import { emptyOffer, toOfferPayload } from '@/models/offer'
import { createMockSdk } from '@/sdk/mock'
import { createMockNetwork, type MockNetwork } from '@/sdk/mock-network'
import type { HostAction } from '@/sdk/types'
import { useSessionStore } from './session'
import { etaMinutes, kindOfAction, netStatusOf, useTxStore, type TrackedTx } from './tx'

const ME = 'PMockUser1111111111111111111111111'

function offerPayload(caption = 'Велосипед') {
  return toOfferPayload({
    ...emptyOffer(ME, 'ru-RU'),
    caption,
    description: 'Хороший',
    tag: 1006,
    geohash: 'srywc',
    priceCents: 1000,
  })
}

function setup(network: MockNetwork = createMockNetwork({ broadcastMs: 1, confirmMs: 20 })) {
  setActivePinia(createPinia())
  const sdk = createMockSdk({ network })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.address = ME
  const tx = useTxStore()
  return { sdk, network, session, tx }
}

describe('tx store', () => {
  beforeEach(() => vi.useRealTimers())

  it('sending → waiting for a block → in the network', async () => {
    const { tx } = setup()
    await tx.start()
    const seen: string[] = []
    tx.subscribe((t) => seen.push(t.status))

    const sent = await tx.send('offer', offerPayload())
    expect(sent.status).toBe('waiting')
    expect(sent.txid).toMatch(/^[0-9a-f]{64}$/)
    // A new offer's id is the txid of its first version.
    expect(sent.target).toBe(sent.txid)
    expect(tx.pendingOffers.map((p) => p.offer.caption)).toEqual(['Велосипед'])

    await vi.waitFor(() => expect(sent.status).toBe('done'))
    expect(seen).toEqual(['sending', 'waiting', 'done'])
    expect(tx.pendingOffers).toEqual([])
  })

  it('a node refusal fails at once and a retry sends the same payload again', async () => {
    const { tx, sdk } = setup()
    await tx.start()
    const payload = offerPayload('!error нет монет')
    const sent = await tx.send('offer', payload)
    expect(sent.status).toBe('failed')
    expect(sent.error).toMatch(/not enough PKOIN/)

    const offers = () => sdk.mock.calls.filter((c) => c.method === 'barteron.offer')
    expect(offers()).toHaveLength(1)
    await tx.retry(sent.id)
    expect(offers()).toHaveLength(2)
    expect(offers()[1]!.args[0]).toEqual(payload)
    expect(sent.attempts).toBe(2)
  })

  it('a transaction that never makes it into a block fails with the host reason', async () => {
    const { tx } = setup()
    await tx.start()
    const sent = await tx.send('offer', offerPayload('!reject'))
    expect(sent.status).toBe('waiting')
    await vi.waitFor(() => expect(sent.status).toBe('failed'))
    expect(sent.error).toBe('notconfirmed')
  })

  it('after a reload, pending actions from the host show up again and settle', async () => {
    const network = createMockNetwork({ broadcastMs: 1, confirmMs: 60 })
    const first = setup(network)
    await first.tx.send('offer', offerPayload('Диван'))

    // A new page: new stores, same host.
    const { tx } = setup(network)
    await tx.start()
    expect(tx.items).toHaveLength(1)
    const restored = tx.items[0]!
    expect(restored).toMatchObject({ kind: 'offer', status: 'waiting' })
    expect(tx.pendingOffers[0]!.offer.caption).toBe('Диван')
    await vi.waitFor(() => expect(restored.status).toBe('done'))
  })

  it('the previous Bastyon tells of the broadcast before it answers: still one entry', async () => {
    const { tx, sdk } = setup()
    await tx.start()
    const send = sdk.barteron.offer
    // pocketnet.gui `actions.js`: `trigger()` right after `self.transaction = …`
    // posts the `action` event; `makeAction` answers after that.
    sdk.barteron.offer = async (data) => {
      const action = await send(data)
      sdk.mock.push('action', { ...action })
      return action
    }
    const sent = await tx.send('offer', offerPayload())
    expect(tx.items).toHaveLength(1)
    expect(tx.items[0]).toBe(sent)
    expect(tx.latestFor(sent.target)).toBe(sent)
    await vi.waitFor(() => expect(sent.status).toBe('done'))
    expect(tx.items.map((t) => t.status)).toEqual(['done'])
    expect(tx.pendingOffers).toEqual([])
  })

  it('an early event that is already settled is kept: in a block, or refused', async () => {
    const { tx, sdk } = setup()
    await tx.start()
    const send = sdk.barteron.offer
    sdk.barteron.offer = async (data) => {
      const action = await send(data)
      sdk.mock.push('action', { ...action, rejected: 'actions_rejectedFromNodes' })
      return action
    }
    const sent = await tx.send('offer', offerPayload())
    expect(tx.items).toEqual([sent])
    expect(sent).toMatchObject({ status: 'failed', error: 'actions_rejectedFromNodes' })
  })

  it('after a reload, a refused removal is retried with the offer id the host needs', async () => {
    const network = createMockNetwork({ broadcastMs: 1, confirmMs: 5 })
    const first = setup(network)
    const hash = 'b'.repeat(64)
    // Sent, then the page reloads before the block.
    const sent = first.tx.send('offerRemove', { hash })
    await sent
    const { tx, sdk } = setup(network)
    tx.onAction({ ...network.actions()[0]!, completed: false, rejected: 'notconfirmed' })
    const restored = tx.items[0]!
    expect(restored).toMatchObject({ kind: 'offerRemove', status: 'failed', target: hash })
    await tx.retry(restored.id)
    const removes = sdk.mock.calls.filter((c) => c.method === 'barteron.removeOffer')
    expect(removes.map((c) => c.args[0])).toEqual([{ hash }])
  })

  it('an edit is about the offer it edits; the newest one about it is the one shown', async () => {
    const { tx } = setup()
    await tx.start()
    const hash = 'c'.repeat(64)
    const withdraw = await tx.send('offer', { ...offerPayload(), hash, published: 'withdrawed' })
    expect(withdraw.target).toBe(hash)
    const renew = await tx.send('offer', { ...offerPayload(), hash, published: 'published' })
    expect(tx.latestFor(hash)).toBe(renew)
    expect(tx.latestFor(hash, ['offerRemove'])).toBeUndefined()
  })

  it('a retry goes only for a failed one: a second press while it waits sends nothing', async () => {
    const { tx, sdk } = setup()
    await tx.start()
    const sent = await tx.send('offer', offerPayload())
    expect(sent.status).toBe('waiting')
    expect(tx.retry(sent.id)).toBeNull()
    expect(tx.retry('nope')).toBeNull()
    expect(sdk.mock.calls.filter((c) => c.method === 'barteron.offer')).toHaveLength(1)
  })

  it('a retry forgets the refused transaction: its late news no longer applies', async () => {
    const { tx } = setup()
    await tx.start()
    const sent = await tx.send('offer', offerPayload('!reject'))
    await vi.waitFor(() => expect(sent.status).toBe('failed'))
    const refused = { id: sent.actionId!, transaction: sent.txid!, completed: true }
    const again = tx.retry(sent.id)!
    expect(sent).toMatchObject({ status: 'sending', txid: null, actionId: null })
    await again
    // The host later finds the first one in a block after all: not this attempt.
    tx.onAction(refused)
    expect(sent.status).toBe('waiting')
  })

  it('the previous Bastyon may queue it without a txid: still sending, then waiting', async () => {
    const { tx, sdk } = setup()
    await tx.start()
    sdk.barteron.account = async () => ({ id: 'queued', transaction: null, completed: false })
    const sent = await tx.send('account', {
      address: ME,
      tags: [],
      geohash: '',
      static: false,
      radius: 0,
    })
    expect(sent).toMatchObject({ status: 'sending', actionId: 'queued', txid: null })
    tx.onAction({ id: 'queued', transaction: 'd'.repeat(64), sent: new Date(1000).toISOString() })
    expect(sent).toMatchObject({ status: 'waiting', txid: 'd'.repeat(64), sentAt: 1000 })
    // News by txid alone finds it too.
    tx.onAction({ transaction: 'd'.repeat(64), completed: true })
    expect(sent.status).toBe('done')
  })

  it('after a reload: only what still waits comes back, with the time the host sent it', async () => {
    const network = createMockNetwork({ broadcastMs: 1, confirmMs: 10 })
    const first = setup(network)
    await first.tx.send('offer', offerPayload('В блоке'))
    await first.tx.send('offer', offerPayload('!reject'))
    await vi.waitFor(() =>
      expect(network.actions().every((a) => a.completed || a.rejected)).toBe(true)
    )

    const { tx, sdk } = setup(network)
    const at = new Date(Date.now() - 5 * 60_000).toISOString()
    const pending: HostAction = {
      id: 'p1',
      transaction: 'e'.repeat(64),
      sent: at,
      added: at,
      expObject: { ...offerPayload('Ждёт') },
    }
    let asked = 0
    sdk.get.actions = async () => {
      asked += 1
      return [...network.actions(), pending]
    }
    await tx.start()
    await tx.start()
    expect(asked).toBe(1)
    expect(tx.items).toHaveLength(1)
    expect(tx.items[0]).toMatchObject({ status: 'waiting', sentAt: Date.parse(at) })
    // Started twice, listening once: one event — one status change.
    const seen: string[] = []
    tx.subscribe((t) => seen.push(t.status))
    sdk.mock.push('action', { ...pending, completed: true })
    expect(seen).toEqual(['done'])
  })

  it('banned users see their action hang, like in the old app', async () => {
    const { tx, session, sdk } = setup()
    session.address = BAN_LIST[0]!
    void tx.send('offer', offerPayload())
    await new Promise((r) => setTimeout(r, 30))
    expect(tx.items[0]!.status).toBe('sending')
    expect(sdk.mock.calls.some((c) => c.method === 'barteron.offer')).toBe(false)
  })
})

describe('tx helpers', () => {
  const base: TrackedTx = {
    id: 'x',
    kind: 'offer',
    status: 'waiting',
    payload: {},
    target: null,
    txid: null,
    actionId: null,
    error: null,
    attempts: 1,
    createdAt: 0,
    sentAt: 0,
    settledAt: null,
  }

  it('recognises our actions by what the host kept (old isOfferAction and the rest)', () => {
    expect(kindOfAction({ expObject: { ...offerPayload() } })).toBe('offer')
    expect(kindOfAction({ expObject: { txidEdit: 'a', type: 'contentDelete' } })).toBe(
      'offerRemove'
    )
    expect(
      kindOfAction({ expObject: { address: ME, tags: [], geohash: '', static: false, radius: 0 } })
    ).toBe('account')
    expect(kindOfAction({ expObject: { type: 'comment' } })).toBe('review')
    expect(kindOfAction({ expObject: { type: 'upvoteShare' } })).toBe('vote')
    expect(kindOfAction({ expObject: { reciever: 'x' } })).toBeNull()
  })

  it('badge status: withdrawing and deleting read differently', () => {
    expect(netStatusOf(base)).toBe('waiting')
    expect(netStatusOf({ ...base, payload: { published: 'withdrawed' } })).toBe('removing')
    expect(netStatusOf({ ...base, kind: 'offerRemove' })).toBe('deleting')
    expect(netStatusOf({ ...base, status: 'failed' })).toBe('failed')
  })

  it('eta is at least a minute', () => {
    expect(etaMinutes({ ...base, sentAt: 1000 }, 1000)).toBe(1)
    expect(etaMinutes({ ...base, sentAt: 0 }, 59_000)).toBe(1)
  })

  it('a finished transaction refreshes what it changed', () => {
    const client = new QueryClient()
    const spy = vi.spyOn(client, 'invalidateQueries')
    refreshAfterTx(client, { kind: 'offer', target: 'o1', status: 'done' }, ME)
    expect(
      spy.mock.calls.map((c) => (c[0] as { queryKey?: unknown } | undefined)?.queryKey)
    ).toEqual([keys.offer('o1'), keys.offersByAddress(ME), keys.feeds])
    spy.mockClear()
    refreshAfterTx(client, { kind: 'vote', target: 'o1', status: 'waiting' }, ME)
    expect(spy).not.toHaveBeenCalled()
  })
})
