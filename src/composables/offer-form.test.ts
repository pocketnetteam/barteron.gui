import { flushPromises, mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw, nextTick } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { keys } from '@/api/queries'
import { BAN_LIST } from '@/config/ban-list'
import { i18n, setLocale } from '@/i18n'
import { shrinkPhoto } from '@/lib/image'
import { readStored, removeStored } from '@/lib/storage'
import { emptyAccount, type BarteronAccount } from '@/models/account'
import { newDraft, readDraft, type OfferDraft } from '@/models/draft'
import { offerFromAlias, type Offer } from '@/models/offer'
import { createAppRouter } from '@/router'
import { createMockSdk, MOCK_ADDRESS, type MockRpcHandler, type MockSdk } from '@/sdk/mock'
import { demoNetworkData } from '@/sdk/mock-data'
import { createMockNetwork } from '@/sdk/mock-network'
import type { HostAction } from '@/sdk/types'
import { useSessionStore } from '@/stores/session'
import { useTxStore } from '@/stores/tx'
import { blockStorage, fillStorage, recordStorage } from '@/test/storage'
import { toasts } from '@/ui/toast'
import { createOfferForm, draftKey, type FormState, type OfferForm } from './offer-form'

vi.mock('@/lib/image', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/image')>()
  return { ...real, shrinkPhoto: vi.fn() }
})

const ME = MOCK_ADDRESS
const PHOTO = 'data:image/jpeg;base64,AAAA'

interface Setup {
  id?: string | null
  rpc?: Record<string, MockRpcHandler>
  /** Seeded into the cache: the offer being edited. */
  offer?: Offer
  /** Seeded into the cache: my Barteron profile. */
  account?: BarteronAccount
  apiVersion?: number
  /** On the device before the form opens. */
  stored?: Record<string, unknown>
  until?: FormState
  /** Signed in as someone else than the mock user. */
  address?: string
  /** Changes to the host before the form opens. */
  before?: (sdk: MockSdk) => void
}

async function setup(options: Setup = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(options.stored ?? {})) {
    localStorage.setItem(key, JSON.stringify(value))
  }
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  const sdk: MockSdk = createMockSdk({
    network: createMockNetwork(demoNetworkData(ME)),
    rpc: options.rpc,
  })
  const session = useSessionStore()
  session.sdk = markRaw(sdk)
  session.address = options.address ?? ME
  session.account = 'signed-in'
  session.mode = 'mock'
  session.appinfo = {
    ...(await sdk.get.appinfo()),
    transactionsApiVersion: options.apiVersion ?? 8,
  }
  options.before?.(sdk)
  const router = createAppRouter(createMemoryHistory())
  await router.push(options.id ? `/barter/create/${options.id}` : '/barter/create')
  // Seeded data stays: the mock network does not know the offers made up here.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  if (options.offer) client.setQueryData(keys.offer(options.offer.hash), options.offer)
  if (options.account) client.setQueryData(keys.account(ME), options.account)
  let form!: OfferForm
  const wrapper = mount(
    defineComponent({
      setup() {
        form = createOfferForm(() => options.id ?? null)
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n, router, [VueQueryPlugin, { queryClient: client }]] } }
  )
  await vi.waitFor(() => expect(form.state.value).toBe(options.until ?? 'ready'))
  await vi.waitFor(() => expect(form.categories.tree.value).toBeTruthy())
  const calls = (method: string) => sdk.mock.calls.filter((c) => c.method === method)
  return { sdk, client, form, wrapper, calls, router }
}

/** Everything a sale needs: the form can publish it. */
function fill(form: OfferForm, patch: Partial<OfferDraft> = {}) {
  Object.assign(form.draft.value!, {
    caption: 'Велосипед',
    description: 'Катался два сезона',
    tag: 1006,
    tags: [17],
    price: '120',
    currency: 'PKOIN',
    geohash: 'srywc8m3qz2k',
    photos: [{ id: 'p1', url: 'https://img/1.jpg', status: 'ready', bytes: 10 }],
    ...patch,
  })
}

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

afterEach(() => {
  vi.useRealTimers()
  vi.mocked(shrinkPhoto).mockReset()
})

const stored = (hash: string | null = null) =>
  readDraft(JSON.parse(localStorage.getItem(draftKey(hash, ME)) ?? 'null'))

const HASH = 'ab'.repeat(32)
/** My offer on chain, as the node returns it. */
const myOffer = (patch: Record<string, unknown> = {}) =>
  offerFromAlias(
    {
      hash: HASH,
      address: ME,
      language: 'ru-RU',
      caption: 'Велосипед',
      description: 'Катался два сезона',
      tag: 1006,
      tags: [17],
      condition: 'used',
      images: ['https://img/1.jpg'],
      geohash: 'srywc8m3qz2k',
      price: 12000,
      time: 1_700_000_000,
      published: 'published',
      ...patch,
    },
    HASH
  )!

describe('the draft on the device', () => {
  it('one write per change, not a write every 400 ms', async () => {
    const { form, wrapper } = await setup()
    const storage = recordStorage()
    try {
      vi.useFakeTimers()
      form.draft.value!.caption = 'Велосипед'
      await nextTick()
      await vi.advanceTimersByTimeAsync(5000)
      const writes = storage.writes.filter(([key]) => key === draftKey(null, ME))
      expect(writes).toHaveLength(1)
      expect(stored()).toMatchObject({ caption: 'Велосипед' })
      expect(stored()!.updatedAt).toBe(form.savedAt.value)
    } finally {
      storage.restore()
      wrapper.unmount()
    }
  })

  it('storage refused: the form does not claim the draft is saved, and keeps it for this visit', async () => {
    const { form, wrapper } = await setup()
    const restore = blockStorage()
    try {
      vi.useFakeTimers()
      form.draft.value!.caption = 'Велосипед'
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      expect(form.savedAt.value).toBeNull()
      expect(form.notKept.value).toBe(true)
      wrapper.unmount()
      // The draft preview and the form opened again in this visit read it.
      expect(readDraft(readStored(draftKey(null, ME), null))?.caption).toBe('Велосипед')
    } finally {
      restore()
      removeStored(draftKey(null, ME))
    }
  })

  it('storage refused, «Начать заново»: the warning goes with the draft', async () => {
    const { form, wrapper } = await setup()
    const restore = blockStorage()
    try {
      vi.useFakeTimers()
      form.draft.value!.caption = 'Велосипед'
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      expect(form.notKept.value).toBe(true)
      await form.discard()
      expect(form.notKept.value).toBe(false)
      expect(readStored(draftKey(null, ME), null)).toBeNull()
      wrapper.unmount()
    } finally {
      restore()
    }
  })

  it('storage full, then room again: «сохранён» only once it is on the device', async () => {
    const { form, wrapper } = await setup()
    vi.useFakeTimers()
    const restore = fillStorage()
    try {
      form.draft.value!.caption = 'Велосипед'
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      expect(form.savedAt.value).toBeNull()
      expect(form.notKept.value).toBe(true)
    } finally {
      restore()
    }
    form.draft.value!.caption = 'Велосипед горный'
    await nextTick()
    await vi.advanceTimersByTimeAsync(500)
    expect(form.savedAt.value).not.toBeNull()
    expect(form.notKept.value).toBe(false)
    expect(stored()).toMatchObject({ caption: 'Велосипед горный' })
    wrapper.unmount()
  })

  it('a draft from before the reload comes back with its date', async () => {
    const { form, wrapper } = await setup({
      stored: { [draftKey(null, ME)]: { ...newDraft('PKOIN', 123), caption: 'Самокат' } },
    })
    expect(form.draft.value!.caption).toBe('Самокат')
    expect(form.restoredAt.value).toBe(123)
    wrapper.unmount()
  })

  it('an empty stored draft is not «continued»', async () => {
    const { form, wrapper } = await setup({
      stored: { [draftKey(null, ME)]: newDraft('PKOIN', 123) },
    })
    expect(form.restoredAt.value).toBeNull()
    wrapper.unmount()
  })

  it('what was typed just before leaving is kept', async () => {
    const { form, wrapper } = await setup()
    form.draft.value!.caption = 'Самокат'
    wrapper.unmount()
    expect(stored()).toMatchObject({ caption: 'Самокат' })
    expect(stored()!.updatedAt).toBeGreaterThan(0)
  })

  it('an edit without changes leaves nothing on the device', async () => {
    const { form, wrapper } = await setup({ id: HASH, offer: myOffer() })
    expect(form.draft.value!.caption).toBe('Велосипед')
    expect(form.dirty.value).toBe(false)
    wrapper.unmount()
    expect(stored(HASH)).toBeNull()
  })

  it('an edit draft continues only on the version it was made from', async () => {
    const draft = { ...newDraft('PKOIN', 5), caption: 'Мой вариант', hash: HASH }
    let s = await setup({
      id: HASH,
      offer: myOffer(),
      stored: { [draftKey(HASH, ME)]: { ...draft, baseTxHash: HASH } },
    })
    expect(s.form.draft.value!.caption).toBe('Мой вариант')
    expect(s.form.restoredAt.value).toBe(5)
    expect(s.form.dirty.value).toBe(true)
    s.wrapper.unmount()

    // The offer changed since: the draft is stale.
    s = await setup({
      id: HASH,
      offer: myOffer(),
      stored: { [draftKey(HASH, ME)]: { ...draft, baseTxHash: 'ef'.repeat(32) } },
    })
    expect(s.form.draft.value!.caption).toBe('Велосипед')
    expect(s.form.restoredAt.value).toBeNull()
    s.wrapper.unmount()
  })

  it('a new offer starts at the place from the profile', async () => {
    const { form, wrapper } = await setup({
      account: { ...emptyAccount(ME), static: true, geohash: 'srywc8' },
    })
    expect(form.draft.value!.geohash).toHaveLength(12)
    expect(form.draft.value!.geohash.startsWith('srywc8')).toBe(true)
    wrapper.unmount()
  })

  it('the profile coming later puts the place only into an untouched new draft', async () => {
    const home: BarteronAccount = { ...emptyAccount(ME), static: true, geohash: 'srywc8' }
    const account = deferred<unknown>()
    let s = await setup({ rpc: { getbarteronaccounts: () => account.promise } })
    expect(s.form.draft.value!.geohash).toBe('')
    s.client.setQueryData(keys.account(ME), home)
    await vi.waitFor(() => expect(s.form.draft.value!.geohash.startsWith('srywc8')).toBe(true))
    s.wrapper.unmount()

    // A draft brought back from the device keeps its own (empty) place.
    s = await setup({
      rpc: { getbarteronaccounts: () => account.promise },
      stored: { [draftKey(null, ME)]: { ...newDraft('PKOIN', 5), caption: 'Самокат' } },
    })
    s.client.setQueryData(keys.account(ME), home)
    await flushPromises()
    expect(s.form.draft.value!.geohash).toBe('')
    s.wrapper.unmount()

    // So does an edit.
    s = await setup({
      id: HASH,
      offer: myOffer({ geohash: '' }),
      rpc: { getbarteronaccounts: () => account.promise },
    })
    s.client.setQueryData(keys.account(ME), home)
    await flushPromises()
    expect(s.form.draft.value!.geohash).toBe('')
    s.wrapper.unmount()
  })

  it('a new version of the offer arriving does not wipe what is being typed', async () => {
    const { form, client, wrapper } = await setup({ id: HASH, offer: myOffer() })
    form.draft.value!.caption = 'Мой вариант'
    client.setQueryData(keys.offer(HASH), myOffer({ caption: 'С другого устройства' }))
    await flushPromises()
    expect(form.draft.value!.caption).toBe('Мой вариант')
    wrapper.unmount()
  })

  it('someone else’s offer is not loaded into the form', async () => {
    const { form, wrapper } = await setup({
      id: HASH,
      offer: myOffer({ address: 'PSomeoneElse111111111111111111111' }),
      until: 'foreign',
    })
    expect(form.draft.value).toBeNull()
    wrapper.unmount()
  })

  it('«Начать заново» forgets the draft and removes a video uploaded for it', async () => {
    const { form, calls, wrapper } = await setup()
    Object.assign(form.draft.value!, {
      caption: 'Самокат',
      video: 'peertube://mock.video/v1',
      videoUploadedHere: true,
    })
    form.draft.value!.caption = 'Самокат'
    wrapper.unmount()
    const again = await setup({ stored: { [draftKey(null, ME)]: stored() } })
    expect(again.form.restoredAt.value).not.toBeNull()
    await again.form.discard()
    expect(again.calls('videos.remove')).toEqual([
      { method: 'videos.remove', args: [{ url: 'peertube://mock.video/v1' }] },
    ])
    expect(again.form.draft.value!.caption).toBe('')
    expect(again.form.restoredAt.value).toBeNull()
    expect(stored()).toBeNull()
    void calls
    again.wrapper.unmount()
  })
})

describe('publishing', () => {
  it('two presses in a row send one transaction', async () => {
    const { form, calls, wrapper } = await setup()
    fill(form)
    await flushPromises()
    expect(form.canPublish.value).toBe(true)
    const results = await Promise.all([form.publish(), form.publish()])
    expect(results.filter(Boolean)).toHaveLength(1)
    expect(calls('barteron.offer')).toHaveLength(1)
    wrapper.unmount()
  })

  it('once sent, the draft leaves the device and the form stops saving', async () => {
    const { form, calls, wrapper } = await setup()
    fill(form)
    await vi.waitFor(() => expect(stored()).not.toBeNull())
    expect(await form.publish()).toBe(true)
    expect(calls('barteron.offer')).toHaveLength(1)
    expect(stored()).toBeNull()
    expect(form.published.value).toBe(true)
    expect(form.canPublish.value).toBe(false)
    form.draft.value!.caption = 'Ещё правка'
    wrapper.unmount()
    expect(stored()).toBeNull()
  })

  it('the node refuses: the reason shows, the draft stays, another try is possible', async () => {
    const { form, wrapper } = await setup()
    fill(form, { caption: '!error велосипед' })
    await vi.waitFor(() => expect(stored()).not.toBeNull())
    expect(await form.publish()).toBe(false)
    expect(form.publishError.value).toContain('not enough PKOIN')
    expect(form.published.value).toBe(false)
    expect(form.canPublish.value).toBe(true)
    expect(stored()).not.toBeNull()
    wrapper.unmount()
  })

  it('a retry after a refusal leaves one offer on its way, not a failed twin to resend', async () => {
    const { form, wrapper } = await setup()
    fill(form, { caption: '!error велосипед' })
    await flushPromises()
    expect(await form.publish()).toBe(false)
    form.draft.value!.caption = 'Велосипед'
    await flushPromises()
    expect(await form.publish()).toBe(true)
    // «Публикуются» in the cabinet: a failed twin there has its own «Повторить».
    expect(useTxStore().pendingOffers.map((p) => [p.offer.caption, p.tx.status])).toEqual([
      ['Велосипед', 'waiting'],
    ])
    wrapper.unmount()
  })

  it('only refused tries of a new offer go: an edit refused, an offer on its way stay', async () => {
    const { form, wrapper } = await setup()
    const txs = useTxStore()
    // A renewal of another offer the node refused, shown in the cabinet as such.
    await txs.send('offer', { hash: HASH, caption: '!error ноутбук' })
    // «Разместить ещё»: the first offer is still waiting for its block.
    fill(form, { caption: 'Первое' })
    await flushPromises()
    expect(await form.publish()).toBe(true)
    form.reset()
    fill(form, { caption: 'Второе' })
    await flushPromises()
    expect(await form.publish()).toBe(true)
    expect(txs.items.map((t) => [(t.payload as { caption: string }).caption, t.status])).toEqual([
      ['!error ноутбук', 'failed'],
      ['Первое', 'waiting'],
      ['Второе', 'waiting'],
    ])
    wrapper.unmount()
  })

  it('a new offer still on its way to the host stays when the form sends another', async () => {
    const { form, sdk, wrapper } = await setup()
    const txs = useTxStore()
    const answer = deferred<HostAction>()
    const send = sdk.barteron.offer
    sdk.barteron.offer = () => answer.promise
    void txs.send('offer', { hash: null, caption: 'В пути' })
    await flushPromises()
    sdk.barteron.offer = send
    fill(form, { caption: 'Второе' })
    await flushPromises()
    expect(await form.publish()).toBe(true)
    expect(txs.items.map((t) => t.status)).toEqual(['sending', 'waiting'])
    answer.resolve({ transaction: 'bb'.repeat(32), completed: false })
    wrapper.unmount()
  })

  it('publishing an edit leaves a refused new offer for the cabinet to retry', async () => {
    const { form, wrapper } = await setup({ id: HASH, offer: myOffer() })
    const txs = useTxStore()
    await txs.send('offer', { hash: null, caption: '!error планшет' })
    form.draft.value!.caption = 'Велосипед горный'
    await flushPromises()
    expect(await form.publish()).toBe(true)
    expect(txs.items.map((t) => t.status)).toEqual(['failed', 'waiting'])
    wrapper.unmount()
  })

  it('leaving while it is being sent: the draft still goes once the host answers', async () => {
    const answer = deferred<HostAction>()
    const { form, sdk, wrapper } = await setup()
    sdk.barteron.offer = () => answer.promise
    fill(form)
    await flushPromises()
    const sending = form.publish()
    await vi.waitFor(() => expect(form.sending.value).toBe(true))
    wrapper.unmount()
    expect(stored()).not.toBeNull()
    answer.resolve({ transaction: 'aa'.repeat(32), completed: false })
    expect(await sending).toBe(true)
    expect(stored()).toBeNull()
  })

  it('an edit keeps the offer’s id', async () => {
    const { form, calls, wrapper } = await setup({ id: HASH, offer: myOffer() })
    form.draft.value!.caption = 'Велосипед горный'
    await flushPromises()
    expect(await form.publish()).toBe(true)
    const [payload] = calls('barteron.offer')[0]!.args as [Record<string, unknown>]
    expect(payload).toMatchObject({ hash: HASH, caption: 'Велосипед горный' })
    expect(form.publishedId.value).toBe(HASH)
    wrapper.unmount()
  })
})

describe('editing an offer with «Мой список»', () => {
  const listed = () => myOffer({ tags: ['my_list'], safeDeal: { validatorFeeVariant: 'seller' } })

  it('the guarantor fee stays while the profile is loading', async () => {
    const account = deferred<unknown>()
    const { form, wrapper } = await setup({
      id: HASH,
      offer: listed(),
      rpc: { getbarteronaccounts: () => account.promise },
    })
    expect(form.account.isPending.value).toBe(true)
    expect(form.offer.value?.safeDeal.validatorFeeVariant).toBe('seller')
    wrapper.unmount()
  })

  it('…and goes once the list is known to have no PKOIN', async () => {
    const { form, wrapper } = await setup({
      id: HASH,
      offer: listed(),
      account: { ...emptyAccount(ME), tags: [1006] },
    })
    expect(form.offer.value?.safeDeal.validatorFeeVariant).toBeUndefined()
    wrapper.unmount()
  })
})

describe('photos', () => {
  const answering = (sdk: MockSdk, ...urls: (string | null)[]) => {
    const upload = vi.fn(async () => {
      const url = urls.length > 1 ? urls.shift()! : urls[0]!
      return url ? [{ url }] : [{ error: 'failed' }]
    })
    sdk.images.upload = upload
    return upload
  }

  it('shrinks one at a time: ten camera photos at once would fill a phone’s memory', async () => {
    let now = 0
    let most = 0
    vi.mocked(shrinkPhoto).mockImplementation(async () => {
      most = Math.max(most, ++now)
      await new Promise((r) => setTimeout(r, 5))
      now--
      return PHOTO
    })
    const { form, sdk, wrapper } = await setup()
    answering(sdk, 'https://img/x.jpg')
    await form.addPhotos([PHOTO, PHOTO, PHOTO, PHOTO])
    expect(most).toBe(1)
    expect(form.draft.value!.photos.map((p) => p.status)).toEqual([
      'ready',
      'ready',
      'ready',
      'ready',
    ])
    wrapper.unmount()
  })

  it('uploads at most three at a time', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    let now = 0
    let most = 0
    sdk.images.upload = async () => {
      most = Math.max(most, ++now)
      await new Promise((r) => setTimeout(r, 5))
      now--
      return [{ url: 'https://img/x.jpg' }]
    }
    await form.addPhotos([PHOTO, PHOTO, PHOTO, PHOTO, PHOTO])
    expect(most).toBe(3)
    wrapper.unmount()
  })

  it('a ready photo is the host’s address and its size; the picture itself is not kept', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue('data:image/jpeg;base64,AAAAAAAA')
    const { form, sdk, wrapper } = await setup()
    const upload = answering(sdk, 'https://img/x.jpg')
    await form.addPhotos([PHOTO])
    expect(upload).toHaveBeenCalledWith({ images: ['data:image/jpeg;base64,AAAAAAAA'] })
    expect(form.draft.value!.photos[0]).toMatchObject({
      url: 'https://img/x.jpg',
      status: 'ready',
      bytes: 6,
    })
    expect(form.draft.value!.photos[0]!.data).toBeUndefined()
    wrapper.unmount()
  })

  it('a failed upload is retried with the same picture', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    const upload = answering(sdk, null, 'https://img/x.jpg')
    await form.addPhotos([PHOTO])
    const photo = form.draft.value!.photos[0]!
    expect(photo.status).toBe('failed')
    expect(form.blocking.value.map((i) => i.key)).toContain('photosFailed')
    form.retryPhoto(photo.id)
    await vi.waitFor(() => expect(form.draft.value!.photos[0]!.status).toBe('ready'))
    expect(upload).toHaveBeenCalledTimes(2)
    expect(shrinkPhoto).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('the host throwing is a failed upload too', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    sdk.images.upload = async () => {
      throw new Error('not_authenticated')
    }
    await form.addPhotos([PHOTO])
    expect(form.draft.value!.photos[0]!.status).toBe('failed')
    wrapper.unmount()
  })

  it('a picture the browser cannot open (HEIC in Chrome) goes, and the seller is told which', async () => {
    const BAD = 'data:image/jpeg;base64,BAD'
    vi.mocked(shrinkPhoto).mockImplementation(async (source) => {
      if (source === BAD || (source instanceof File && source.name.endsWith('.HEIC'))) {
        throw new Error('image:unreadable')
      }
      return PHOTO
    })
    const { form, sdk, wrapper } = await setup()
    answering(sdk, 'https://img/x.jpg')
    await form.addPhotos([
      new File(['x'], 'IMG_0001.HEIC', { type: 'image/heic' }),
      new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
      BAD,
    ])
    // Not «не загрузилось — повторите»: a retry would not open it either.
    expect(form.draft.value!.photos.map((p) => p.status)).toEqual(['ready'])
    expect(form.blocking.value.map((i) => i.key)).not.toContain('photosFailed')
    // A camera picture has no name.
    expect(form.unreadable.value).toEqual(['IMG_0001.HEIC', ''])
    // Adding again starts afresh.
    await form.addPhotos([PHOTO])
    expect(form.unreadable.value).toEqual([])
    expect(form.draft.value!.photos).toHaveLength(2)
    wrapper.unmount()
  })

  it('no more than ten; the seller is told how many were added', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    answering(sdk, 'https://img/x.jpg')
    await form.addPhotos(Array.from({ length: 8 }, () => PHOTO))
    await form.addPhotos([PHOTO, PHOTO, PHOTO, PHOTO])
    expect(form.draft.value!.photos).toHaveLength(10)
    expect(form.photoNotice.value).toEqual({ kind: 'limit', added: 10, total: 12 })
    form.removePhoto(form.draft.value!.photos[0]!.id)
    expect(form.photoNotice.value).toBeNull()
    expect(form.draft.value!.photos).toHaveLength(9)
    wrapper.unmount()
  })

  it('a file that is not a picture is not added', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    answering(sdk, 'https://img/x.jpg')
    await form.addPhotos([new File(['x'], 'a.pdf', { type: 'application/pdf' })])
    expect(form.draft.value!.photos).toHaveLength(0)
    expect(form.photoNotice.value).toEqual({ kind: 'type' })
    await form.addPhotos([new File(['x'], 'a.jpg', { type: 'image/JPEG' })])
    expect(form.draft.value!.photos).toHaveLength(1)
    expect(form.photoNotice.value).toBeNull()
    wrapper.unmount()
  })

  it('removed while uploading: the host’s answer is dropped', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    const answer = deferred<unknown>()
    sdk.images.upload = () => answer.promise
    const adding = form.addPhotos([PHOTO])
    await vi.waitFor(() => expect(form.draft.value!.photos[0]!.data).toBe(PHOTO))
    form.removePhoto(form.draft.value!.photos[0]!.id)
    answer.resolve([{ url: 'https://img/x.jpg' }])
    await adding
    expect(form.draft.value!.photos).toEqual([])
    wrapper.unmount()
  })

  it('moving: to the cover and back; out of range does nothing', async () => {
    const { form, wrapper } = await setup()
    const photos = ['a', 'b', 'c'].map((id) => ({
      id,
      url: `https://img/${id}.jpg`,
      status: 'ready' as const,
      bytes: 1,
    }))
    form.draft.value!.photos = photos
    const order = () => form.draft.value!.photos.map((p) => p.id).join('')
    form.movePhoto(2, 0)
    expect(order()).toBe('cab')
    form.movePhoto(0, 2)
    expect(order()).toBe('abc')
    form.movePhoto(1, 1)
    expect(order()).toBe('abc')
    form.movePhoto(-1, 0)
    expect(order()).toBe('abc')
    form.movePhoto(0, 3)
    expect(order()).toBe('abc')
    form.movePhoto(3, 0)
    expect(order()).toBe('abc')
    wrapper.unmount()
  })

  it('the phone camera: a bare picture gets its prefix', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, wrapper } = await setup()
    answering(sdk, 'https://img/x.jpg')
    sdk.get.imageFromMobileCamera = async () => ({
      images: [{ image: 'BBBB' }, 'data:image/png;base64,CCCC', { image: 42 }],
    })
    await form.takePhoto()
    expect(vi.mocked(shrinkPhoto).mock.calls.map(([s]) => s)).toEqual([
      'data:image/jpeg;base64,BBBB',
      'data:image/png;base64,CCCC',
    ])
    wrapper.unmount()
  })

  it('the phone camera without permission adds nothing and says so', async () => {
    const { form, sdk, calls, wrapper } = await setup()
    sdk.permissions.check = async () => false
    const before = toasts.items.length
    await form.takePhoto()
    expect(calls('permissions.request')).toHaveLength(1)
    expect(form.draft.value!.photos).toHaveLength(0)
    expect(toasts.items.slice(before).map((t) => t.text)).toEqual([
      'Камера недоступна. Выберите фото из галереи.',
    ])
    wrapper.unmount()
  })

  it('the camera closed without a picture: nothing added, and no «камера недоступна»', async () => {
    const { form, sdk, wrapper } = await setup()
    const before = toasts.items.length
    // Both hosts answer a closed camera so (pocketnet.gui `mobile.camera`, bastyon-nextgen media.ts).
    sdk.get.imageFromMobileCamera = async () => {
      throw new Error('mobile:camera:cancel')
    }
    await form.takePhoto()
    // The previous Bastyon's `appsError` arrives as an object.
    sdk.get.imageFromMobileCamera = () => Promise.reject({ message: 'mobile:camera:cancel' })
    await form.takePhoto()
    // Nothing picked.
    sdk.get.imageFromMobileCamera = async () => ({ images: [] })
    await form.takePhoto()
    expect(form.draft.value!.photos).toHaveLength(0)
    expect(toasts.items.length).toBe(before)

    sdk.get.imageFromMobileCamera = async () => {
      throw new Error('mobile:camera:notsupported')
    }
    await form.takePhoto()
    expect(toasts.items.slice(before).map((t) => t.text)).toEqual([
      'Камера недоступна. Выберите фото из галереи.',
    ])
    wrapper.unmount()
  })
})

describe('video', () => {
  const withVideo = (video: string) => myOffer({ video })

  it('added in the form, removing it deletes it from the storage', async () => {
    const { form, calls, wrapper } = await setup()
    await form.addVideo()
    expect(form.draft.value!.video).toMatch(/^peertube:\/\/mock\.video\//)
    expect(form.draft.value!.videoUploadedHere).toBe(true)
    const url = form.draft.value!.video
    await form.removeVideo()
    expect(form.draft.value!.video).toBe('')
    expect(calls('videos.remove')).toEqual([{ method: 'videos.remove', args: [{ url }] }])
    wrapper.unmount()
  })

  it('one already in the offer only leaves the offer', async () => {
    const { form, calls, wrapper } = await setup({
      id: HASH,
      offer: withVideo('peertube://mock.video/old?ready=1'),
    })
    await form.removeVideo()
    expect(form.offer.value?.video).toBe('')
    expect(calls('videos.remove')).toHaveLength(0)
    wrapper.unmount()
  })

  it('a banned user: photos never reach the host, the video window never opens (old app)', async () => {
    vi.mocked(shrinkPhoto).mockResolvedValue(PHOTO)
    const { form, sdk, calls, wrapper } = await setup({ address: BAN_LIST[0] })
    const upload = vi.fn(async () => [{ url: 'https://img/x.jpg' }])
    sdk.images.upload = upload
    void form.addPhotos([PHOTO])
    void form.addVideo()
    await new Promise((r) => setTimeout(r, 50))
    expect(upload).not.toHaveBeenCalled()
    expect(form.draft.value!.photos.map((p) => p.status)).toEqual(['uploading'])
    expect(calls('videos.opendialog')).toHaveLength(0)
    expect(form.videoBusy.value).toBe(true)
    wrapper.unmount()
  })

  it('the window closed without a video changes nothing', async () => {
    const { form, sdk, wrapper } = await setup()
    sdk.mock.failNext('videos.opendialog')
    await form.addVideo()
    expect(form.draft.value!.video).toBe('')
    expect(form.videoBusy.value).toBe(false)
    // Not «не удалось открыть загрузку видео»: closing it is the user's choice.
    expect(toasts.items).toEqual([])
    // The previous Bastyon answers a closed window with nothing, and its sdk.js
    // makes that `{}` (`{data = {}}`); bastyon-nextgen sends `null`, as above.
    sdk.videos.opendialog = async () => ({})
    await form.addVideo()
    expect(form.draft.value!.video).toBe('')
    expect(toasts.items).toEqual([])
    wrapper.unmount()
  })

  it('the host failing to open the window says so', async () => {
    const { form, sdk, wrapper } = await setup()
    sdk.videos.opendialog = async () => {
      throw new Error('timeout')
    }
    await form.addVideo()
    expect(form.draft.value!.video).toBe('')
    expect(form.videoBusy.value).toBe(false)
    expect(toasts.items.at(-1)).toMatchObject({
      kind: 'error',
      text: 'Не удалось открыть загрузку видео. Попробуйте ещё раз.',
    })
    wrapper.unmount()
  })

  it('still processing holds publishing; processed lets it go', async () => {
    const { form, wrapper } = await setup({
      id: HASH,
      offer: withVideo(`peertube://mock.video/v?ready=${Date.now() + 60_000}`),
    })
    await vi.waitFor(() => expect(form.videoStatus.value).toBe('processing'))
    expect(form.waits.value.map((i) => i.key)).toContain('videoProcessing')
    expect(form.canPublish.value).toBe(false)
    wrapper.unmount()

    const ready = await setup({ id: HASH, offer: withVideo('peertube://mock.video/v?ready=1') })
    await vi.waitFor(() => expect(ready.form.videoStatus.value).toBe('ready'))
    expect(ready.form.canPublish.value).toBe(true)
    ready.wrapper.unmount()
  })

  it('a host without videos neither checks nor drops the offer’s video', async () => {
    const { form, calls, wrapper } = await setup({
      id: HASH,
      offer: withVideo('peertube://mock.video/old'),
      apiVersion: 3,
    })
    await flushPromises()
    expect(form.videosSupported.value).toBe(false)
    expect(calls('get.videos')).toHaveLength(0)
    expect(form.issues.value.filter((i) => i.field === 'video')).toEqual([])
    expect(form.offer.value?.video).toBe('peertube://mock.video/old')
    wrapper.unmount()
  })

  it('the host not answering about the video is not «обработка завершилась ошибкой»', async () => {
    let answering = false
    const { form, wrapper } = await setup({
      id: HASH,
      offer: withVideo('peertube://mock.video/v?ready=1'),
      before: (sdk) => {
        const real = sdk.get.videos
        sdk.get.videos = (urls) => (answering ? real(urls) : Promise.reject(new Error('timeout')))
      },
    })
    // One retry of its own first.
    await vi.waitFor(() => expect(form.videoStatus.value).toBe('unchecked'), { timeout: 4000 })
    const keys = form.blocking.value.map((i) => i.key)
    expect(keys).toContain('videoUnchecked')
    // «Удалите видео» would lose a good one.
    expect(keys).not.toContain('videoFailed')
    expect(form.canPublish.value).toBe(false)
    answering = true
    form.retryVideo()
    await vi.waitFor(() => expect(form.videoStatus.value).toBe('ready'))
    expect(form.canPublish.value).toBe(true)
    wrapper.unmount()
  })

  it('a video PeerTube no longer has holds publishing', async () => {
    const { form, wrapper } = await setup({
      id: HASH,
      offer: withVideo('peertube://mock.video/gone'),
    })
    await vi.waitFor(() => expect(form.videoStatus.value).toBe('missing'))
    expect(form.blocking.value.map((i) => i.key)).toContain('videoMissing')
    wrapper.unmount()
  })
})

describe('steps', () => {
  it('«Далее» with something missing stays and shows it, then moves on; «Назад» returns', async () => {
    const { form, router, wrapper } = await setup()
    expect(form.step.value).toBe('what')
    expect(form.fieldError('caption')).toBeUndefined()
    expect(form.next()).toBe(false)
    expect(form.step.value).toBe('what')
    expect(form.fieldError('caption')).toBe('Укажите название')
    // Errors of steps not reached yet stay hidden.
    expect(form.fieldError('place')).toBeUndefined()
    fill(form)
    expect(form.next()).toBe(true)
    await vi.waitFor(() => expect(router.currentRoute.value.query.step).toBe('2'))
    expect(form.step.value).toBe('media')
    form.back()
    await vi.waitFor(() => expect(router.currentRoute.value.query.step).toBeUndefined())
    expect(form.step.value).toBe('what')
    wrapper.unmount()
  })

  it('reaching the review shows what is missing on every step', async () => {
    const { form, router, wrapper } = await setup()
    fill(form, { geohash: '' })
    await form.goTo('exchange')
    expect(form.next()).toBe(true)
    await vi.waitFor(() => expect(form.step.value).toBe('place'))
    expect(form.fieldError('place')).toBeUndefined()
    form.draft.value!.geohash = 'srywc8m3qz2k'
    expect(form.next()).toBe(true)
    await vi.waitFor(() => expect(form.step.value).toBe('review'))
    form.draft.value!.caption = ''
    expect(form.fieldError('caption')).toBe('Укажите название')
    void router
    wrapper.unmount()
  })

  it('a step number that does not exist is the first step', async () => {
    const { form, router, wrapper } = await setup()
    for (const step of ['9', '0', '1.5', 'abc']) {
      await router.replace({ query: { step } })
      expect(form.stepIndex.value).toBe(0)
    }
    await router.replace({ query: { step: '5' } })
    expect(form.step.value).toBe('review')
    wrapper.unmount()
  })

  it('«Опубликовать» with something missing goes to it instead', async () => {
    const { form, router, calls, wrapper } = await setup()
    fill(form, { price: '' })
    await form.goTo('review')
    expect(await form.publish()).toBe(false)
    await vi.waitFor(() => expect(form.step.value).toBe('exchange'))
    expect(router.currentRoute.value.query.step).toBe('3')
    expect(calls('barteron.offer')).toHaveLength(0)
    wrapper.unmount()
  })

  it('a pickup point: its own steps, the cost in PKOIN, always «от»', async () => {
    const { form, wrapper } = await setup()
    fill(form, { currency: 'RUB', fixCurrency: true, priceFrom: true })
    await form.goTo('review')
    form.draft.value!.tag = 97
    await vi.waitFor(() => expect(form.steps.value).toContain('point'))
    expect(form.draft.value).toMatchObject({
      currency: 'PKOIN',
      fixCurrency: false,
      priceFrom: false,
    })
    expect(form.step.value).toBe('review')
    // The showcase (tests, dev) lets the mock user open one…
    expect(form.pointForbidden.value).toBe(false)
    // …the real app only listed addresses, while pickup points are being tried out.
    form.draft.value!.tag = 1006
    vi.stubEnv('VITE_SHOWCASE', 'false')
    form.draft.value!.tag = 97
    await flushPromises()
    expect(form.pointForbidden.value).toBe(true)
    expect(form.canPublish.value).toBe(false)
    vi.unstubAllEnvs()
    wrapper.unmount()
  })
})

describe('the page', () => {
  it('a bad id or a removed offer: nothing to edit', async () => {
    let s = await setup({ id: 'not-a-txid', until: 'missing' })
    s.wrapper.unmount()
    s = await setup({ id: HASH, offer: myOffer({ published: 'removed' }), until: 'missing' })
    s.wrapper.unmount()
  })

  it('a Bastyon account still being registered: the form fills, publishing waits', async () => {
    const { form, wrapper } = await setup({ rpc: { getuserprofile: () => [] } })
    await vi.waitFor(() => expect(form.activating.value).toBe(true))
    fill(form)
    await flushPromises()
    expect(form.blocking.value).toEqual([])
    expect(form.canPublish.value).toBe(false)
    wrapper.unmount()
  })

  it('a new offer’s page is its first txid; «Разместить ещё» starts empty', async () => {
    const { form, wrapper } = await setup()
    fill(form)
    await flushPromises()
    expect(await form.publish()).toBe(true)
    expect(form.publishedId.value).toMatch(/^[0-9a-f]{64}$/)
    form.reset()
    expect(form.published.value).toBe(false)
    expect(form.publishedId.value).toBeNull()
    expect(form.draft.value!.caption).toBe('')
    expect(form.tried.size).toBe(0)
    wrapper.unmount()
  })
})
