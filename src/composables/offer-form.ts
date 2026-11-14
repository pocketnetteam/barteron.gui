import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  computed,
  inject,
  onBeforeUnmount,
  provide,
  reactive,
  ref,
  toValue,
  watch,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAccount, useCategories, useOffer, useRates, useUserProfile } from '@/api/queries'
import { parseVideoInfo } from '@/components/item/gallery'
import { hangIfBanned } from '@/config/ban'
import { isPickupPointOwner } from '@/config/delivery'
import { dataUrlBytes, isPhotoFile, shrinkPhoto } from '@/lib/image'
import { createLimiter } from '@/lib/limit'
import { readStored, removeStored, userKey, writeStored } from '@/lib/storage'
import {
  draftFromOffer,
  draftHasContent,
  draftIssues,
  isPointDraft,
  MAX_PHOTOS,
  newDraft,
  offerFromDraft,
  photoId,
  PKOIN,
  readDraft,
  stepsOf,
  storedDraft,
  type DraftIssue,
  type DraftPhoto,
  type DraftStep,
  type OfferDraft,
} from '@/models/draft'
import { homePlaceStart } from '@/models/account'
import { isTxid } from '@/models/tx'
import { OfferInvalidError, toOfferPayload, type Offer } from '@/models/offer'
import { useCurrencyStore } from '@/stores/currency'
import { useSessionStore } from '@/stores/session'
import { errorText, useTxStore } from '@/stores/tx'
import { showToast } from '@/ui/toast'

/** Bastyon locale for `p.s1`, as the old app wrote `$i18n.locale`. */
const LANGUAGE_TAG: Record<string, string> = { ru: 'ru-RU', en: 'en-US', sr: 'sr-RS' }

/** Photos sent to the host at once: enough to be quick, not a flood. */
const UPLOAD_SLOTS = 3
/** The old app checked a video every 20 seconds while PeerTube processed it. */
const VIDEO_POLL_MS = 20_000

export type FormState = 'loading' | 'signin' | 'missing' | 'foreign' | 'error' | 'ready'

/** Where the form puts the draft: one for a new offer, one per edited offer. */
export const draftKey = (hash: string | null, address: string | null): string =>
  userKey(hash ? `offer_draft_${hash}` : 'offer_draft', address)
/**
 * Everything the offer form (s4) knows: the draft and where it is kept, the
 * steps and what is missing on each, photo uploads, the video and publishing.
 * Created once by the page and handed to the steps through `provide`.
 */
export function createOfferForm(id: MaybeRefOrGetter<string | null | undefined>) {
  const { t, locale } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const session = useSessionStore()
  const txStore = useTxStore()
  const currency = useCurrencyStore()
  const categories = useCategories()
  const rates = useRates()
  const client = useQueryClient()

  /** The offer being edited; `null` — a new one (the old app also accepted `draft`). */
  const hash = computed(() => {
    const value = toValue(id)
    return value && isTxid(value) ? value : null
  })
  const badId = computed(() => {
    const value = toValue(id)
    return !!value && value !== 'draft' && !isTxid(value)
  })
  const editing = computed(() => !!hash.value)
  const me = computed(() => session.address)

  const original = useOffer(hash)
  const account = useAccount(me)
  const profile = useUserProfile(me)
  const myList = computed<readonly number[]>(() => account.data.value?.tags ?? [])

  // ─── The draft and where it lives ─────────────────────────────────────────
  const draft = ref<OfferDraft | null>(null)
  /** A draft found on the device when the form opened: «Продолжаем черновик». */
  const restoredAt = ref<number | null>(null)
  /** When the draft last went to the device. */
  const savedAt = ref<number | null>(null)
  /**
   * The device would not take the draft (storage blocked or full): it lives
   * until the app restarts, and the form says so instead of «сохранён».
   */
  const notKept = ref(false)
  /** What the form started from, to tell whether anything changed. */
  let initial = ''
  const published = ref(false)

  const snapshot = (value: OfferDraft) => JSON.stringify({ ...storedDraft(value), updatedAt: 0 })

  const defaultCurrency = () => (currency.pkoinOnly ? PKOIN : currency.code)

  /**
   * A new offer starts at «Место для новых объявлений» when the profile fixes
   * one (cabinet settings: `static` and `geohash` of tx 104).
   */
  const homePlace = () => homePlaceStart(account.data.value)
  const fresh = (): OfferDraft => ({ ...newDraft(defaultCurrency()), geohash: homePlace() })

  function start(value: OfferDraft, restored: boolean) {
    draft.value = value
    restoredAt.value = restored ? value.updatedAt : null
    initial =
      restored && editing.value && original.data.value
        ? snapshot(draftFromOffer(original.data.value, locale.value))
        : snapshot(value)
  }

  watch(
    [me, hash, () => original.data.value, () => session.account],
    () => {
      if (draft.value || !me.value) return
      const stored = readDraft(readStored<unknown>(draftKey(hash.value, me.value), null))
      if (!hash.value) {
        start(stored ?? fresh(), !!stored && draftHasContent(stored))
        return
      }
      const offer = original.data.value
      if (!offer || offer.address !== me.value) return
      // A draft made from an older version is stale: the offer changed since.
      if (stored && stored.baseTxHash === offer.txHash) start(stored, true)
      else start(draftFromOffer(offer, locale.value), false)
    },
    { immediate: true }
  )

  // The profile may come after the form opened: a new, untouched draft gets the place then.
  watch(
    () => account.data.value,
    () => {
      const value = draft.value
      if (!value || editing.value || restoredAt.value !== null || value.geohash) return
      if (draftHasContent(value)) return
      value.geohash = homePlace()
    }
  )

  const dirty = computed(() => !!draft.value && snapshot(draft.value) !== initial)

  /**
   * Keeps the draft on the device. The time goes only into the stored copy:
   * stamping the draft itself would wake the watcher below and save again
   * every 400 ms for as long as the form is open.
   */
  function save() {
    const value = draft.value
    if (!value || published.value || !me.value) return
    // Nothing typed yet, or an edit with no changes: nothing worth keeping.
    if (editing.value ? !dirty.value : !draftHasContent(value)) return
    const now = Date.now()
    const kept = writeStored(draftKey(hash.value, me.value), {
      ...storedDraft(value),
      updatedAt: now,
    })
    savedAt.value = kept ? now : null
    notKept.value = !kept
  }

  let saveTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    draft,
    (value) => {
      if (!value || published.value) return
      clearTimeout(saveTimer)
      saveTimer = setTimeout(save, 400)
    },
    { deep: true }
  )

  function forgetStored() {
    removeStored(draftKey(hash.value, me.value))
    savedAt.value = null
    notKept.value = false
  }

  /** «Начать заново»: the stored draft goes, and a video uploaded for it leaves the storage. */
  async function discard() {
    const value = draft.value
    forgetStored()
    originals.clear()
    restoredAt.value = null
    if (value?.video && value.videoUploadedHere) {
      await session.sdk?.videos.remove({ url: value.video }).catch(() => undefined)
    }
    const offer = original.data.value
    start(offer && editing.value ? draftFromOffer(offer, locale.value) : fresh(), false)
    void goTo(stepsOf(draft.value!)[0]!, true)
  }

  // ─── Page state ────────────────────────────────────────────────────────────
  const state = computed<FormState>(() => {
    if (session.account === 'guest' || session.account === 'no-permission') return 'signin'
    if (badId.value) return 'missing'
    if (editing.value) {
      if (original.isError.value) return 'error'
      if (original.isSuccess.value) {
        const offer = original.data.value
        if (!offer || offer.published === 'removed') return 'missing'
        if (me.value && offer.address !== me.value) return 'foreign'
      }
    }
    return draft.value ? 'ready' : 'loading'
  })

  /**
   * The Bastyon account is still being registered: no profile on the node yet
   * (old `pending_reg`, checked by the name). The form can be filled; publishing waits.
   */
  const activating = computed(
    () => profile.isSuccess.value && (!profile.data.value || !profile.data.value.name)
  )
  let profileTimer: ReturnType<typeof setInterval> | undefined
  watch(
    activating,
    (on) => {
      clearInterval(profileTimer)
      if (on) profileTimer = setInterval(() => void profile.refetch(), 30_000)
    },
    { immediate: true }
  )

  /** Pickup points are in public testing: only listed addresses may open one. */
  const pointForbidden = computed(
    () => !!draft.value && isPointDraft(draft.value) && !isPickupPointOwner(me.value)
  )

  // ─── Video ─────────────────────────────────────────────────────────────────
  // A pickup point's cost is in PKOIN, always «от», and it has no video.
  watch(
    () => !!draft.value && isPointDraft(draft.value),
    (point) => {
      const value = draft.value
      if (!point || !value) return
      value.currency = PKOIN
      value.fixCurrency = false
      value.priceFrom = false
    },
    { immediate: true }
  )

  /**
   * Hosts before transactions API 4 have no videos (old `videoOperationsAvailable`).
   * There the offer's video is neither checked nor dropped: the old form wrote
   * an empty one, losing it; keeping it loses nothing.
   */
  const videosSupported = computed(() => (session.appinfo?.transactionsApiVersion ?? 0) >= 4)
  const videoUrl = computed(() => (videosSupported.value && draft.value?.video) || null)
  const video = useQuery({
    queryKey: computed(() => ['bastyon', 'video-state', videoUrl.value]),
    enabled: computed(() => !!session.sdk && !!videoUrl.value),
    staleTime: 0,
    retry: 1,
    queryFn: async () => parseVideoInfo(await session.sdk!.get.videos([videoUrl.value!], true)),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing'
        ? session.mode === 'mock'
          ? 1500
          : VIDEO_POLL_MS
        : false,
  })
  const videoStatus = computed(() => {
    if (!videoUrl.value) return null
    if (video.isPending.value) return 'loading' as const
    // The host did not answer: nothing is known about the video itself.
    if (video.isError.value) return 'unchecked' as const
    return video.data.value?.status ?? 'loading'
  })

  const videoBusy = ref(false)
  async function addVideo(): Promise<void> {
    const sdk = session.sdk
    if (!sdk || !draft.value || videoBusy.value) return
    videoBusy.value = true
    try {
      // Nor did their video window open.
      await hangIfBanned(session.address)
      const result = (await sdk.videos.opendialog()) as { link?: unknown } | null | undefined
      if (result && typeof result.link === 'string' && result.link && draft.value) {
        draft.value.video = result.link
        draft.value.videoUploadedHere = true
      }
    } catch {
      // Closing the window answers `null`; an error is the host's (signed out, timeout).
      showToast(t('create.media.videoOpenFailed'), { kind: 'error' })
    } finally {
      videoBusy.value = false
    }
  }

  /** A video uploaded in this form leaves the storage; one already published only leaves the offer. */
  async function removeVideo(): Promise<void> {
    const value = draft.value
    if (!value?.video) return
    const url = value.video
    const here = value.videoUploadedHere
    value.video = ''
    value.videoUploadedHere = false
    if (here) await session.sdk?.videos.remove({ url }).catch(() => undefined)
  }

  // ─── Photos ────────────────────────────────────────────────────────────────
  /** «Добавлено только 10 из 12 — это максимум»; «можно JPEG или PNG». */
  const photoNotice = ref<
    { kind: 'limit'; added: number; total: number } | { kind: 'type' } | null
  >(null)
  const uploadSlot = createLimiter(UPLOAD_SLOTS)
  /**
   * One picture decoded at a time: a camera photo opens into tens of MB, and
   * ten of them at once can take a phone's memory (the host shrinks one by one
   * for the same reason).
   */
  const shrinkSlot = createLimiter(1)
  /** What the seller added, until it is read. Not stored. */
  const originals = new Map<string, File | string>()
  /**
   * Pictures the browser could not open since the last adding (HEIC outside
   * Safari, a damaged file): their file names, `''` for a camera picture.
   */
  const unreadable = ref<string[]>([])

  const findPhoto = (pid: string): DraftPhoto | undefined =>
    draft.value?.photos.find((p) => p.id === pid)

  /** The picture → a small JPEG in the draft, then off to the host. */
  async function prepare(pid: string): Promise<void> {
    const source = originals.get(pid)
    const photo = findPhoto(pid)
    if (!source || !photo) return
    photo.status = 'uploading'
    try {
      const data = await shrinkSlot(() =>
        // Removed while waiting: nothing to read.
        findPhoto(pid) ? shrinkPhoto(source) : Promise.resolve(null)
      )
      const shrunk = findPhoto(pid)
      if (!data || !shrunk) return
      shrunk.data = data
      shrunk.bytes = dataUrlBytes(data)
      originals.delete(pid)
    } catch {
      // Reading it again would not open it: it goes, and the seller is told which.
      originals.delete(pid)
      const value = draft.value
      if (value && findPhoto(pid)) {
        value.photos = value.photos.filter((p) => p.id !== pid)
        unreadable.value.push(typeof source === 'string' ? '' : source.name)
      }
      return
    }
    await upload(pid)
  }

  async function upload(pid: string): Promise<void> {
    const photo = findPhoto(pid)
    if (!photo?.data) return
    photo.status = 'uploading'
    // A banned user's photos never reached the host in the old app either.
    await hangIfBanned(session.address)
    await uploadSlot(async () => {
      try {
        const current = findPhoto(pid)
        // Removed while waiting.
        if (!current?.data) return
        const answer = (await session.sdk!.images.upload({ images: [current.data] })) as unknown
        const first = Array.isArray(answer)
          ? (answer[0] as { url?: unknown } | undefined)
          : undefined
        const done = findPhoto(pid)
        if (!done) return
        if (first && typeof first.url === 'string' && first.url) {
          done.url = first.url
          done.status = 'ready'
          delete done.data
        } else done.status = 'failed'
      } catch {
        const failed = findPhoto(pid)
        if (failed) failed.status = 'failed'
      }
    })
  }

  /** Files from the picker, a drop or the clipboard; data URLs from the camera. */
  async function addPhotos(sources: readonly (File | string)[]): Promise<void> {
    const value = draft.value
    if (!value || !session.sdk) return
    const usable = sources.filter((s) => typeof s === 'string' || isPhotoFile(s))
    unreadable.value = []
    photoNotice.value = usable.length < sources.length ? { kind: 'type' } : null
    const room = Math.max(0, MAX_PHOTOS - value.photos.length)
    const taken = usable.slice(0, room)
    if (usable.length > room) {
      photoNotice.value = {
        kind: 'limit',
        added: value.photos.length + taken.length,
        total: value.photos.length + usable.length,
      }
    }
    const added = taken.map((source) => {
      const photo: DraftPhoto = { id: photoId(), url: null, status: 'uploading', bytes: 0 }
      value.photos.push(photo)
      originals.set(photo.id, source)
      return photo.id
    })
    await Promise.all(added.map(prepare))
  }

  /** Not uploaded: send the same picture again. */
  function retryPhoto(pid: string) {
    void upload(pid)
  }

  function removePhoto(pid: string) {
    const value = draft.value
    if (!value) return
    value.photos = value.photos.filter((p) => p.id !== pid)
    originals.delete(pid)
    if (photoNotice.value?.kind === 'limit') photoNotice.value = null
  }

  function movePhoto(from: number, to: number) {
    const list = draft.value?.photos
    if (!list || from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
      return
    }
    const [item] = list.splice(from, 1)
    list.splice(to, 0, item!)
  }

  /**
   * Bastyon's camera on a phone: `{images: [{image}]}`; a bare base64 gets its
   * prefix. Closed without a picture, both hosts answer `mobile:camera:cancel`:
   * nothing to say then. No permission or no camera — «Камера недоступна».
   */
  async function takePhoto(): Promise<void> {
    const sdk = session.sdk
    if (!sdk) return
    const unavailable = () => void showToast(t('create.media.cameraFailed'))
    const granted = await sdk.permissions.check({ permission: 'mobilecamera' }).catch(() => false)
    if (!granted) {
      await sdk.permissions.request(['mobilecamera']).catch(() => undefined)
      if (!(await sdk.permissions.check({ permission: 'mobilecamera' }).catch(() => false))) {
        return unavailable()
      }
    }
    let answer: { images?: unknown } | null
    try {
      answer = (await sdk.get.imageFromMobileCamera()) as { images?: unknown } | null
    } catch (error) {
      if (!/cancel/.test(errorText(error))) unavailable()
      return
    }
    const images = Array.isArray(answer?.images) ? answer!.images : []
    const sources = images
      .map((i) => (typeof i === 'string' ? i : (i as { image?: unknown })?.image))
      .filter((i): i is string => typeof i === 'string' && !!i)
      .map((i) => (i.startsWith('data:') ? i : `data:image/jpeg;base64,${i}`))
    if (sources.length) await addPhotos(sources)
  }

  // ─── Steps ─────────────────────────────────────────────────────────────────
  const steps = computed<DraftStep[]>(() =>
    draft.value ? stepsOf(draft.value) : stepsOf({ tag: null })
  )
  /** 1-based in the address, so the phone's back button walks the steps. */
  const stepIndex = computed(() => {
    const n = Number(route.query.step)
    return Number.isInteger(n) && n >= 1 && n <= steps.value.length ? n - 1 : 0
  })
  const step = computed(() => steps.value[stepIndex.value]!)
  /** Steps where errors show: the seller tried to leave them, or reached the review. */
  const tried = reactive(new Set<DraftStep>())

  const issues = computed<DraftIssue[]>(() =>
    draft.value
      ? draftIssues(draft.value, {
          tree: categories.tree.value,
          rates: rates.data.value ?? null,
          videoStatus: videoStatus.value,
          myList: account.isSuccess.value ? myList.value : undefined,
        })
      : []
  )
  const errorsOf = (s: DraftStep) => issues.value.filter((i) => i.step === s && i.level === 'error')
  const blocking = computed(() => issues.value.filter((i) => i.level === 'error'))
  const waits = computed(() => issues.value.filter((i) => i.level === 'wait'))

  const issueText = (issue: DraftIssue) => t(`create.issue.${issue.key}`, issue.params ?? {})

  /** The error under a field, once the seller tried to leave its step. */
  function fieldError(field: string): string | undefined {
    const issue = issues.value.find(
      (i) => i.field === field && i.level === 'error' && tried.has(i.step)
    )
    return issue ? issueText(issue) : undefined
  }

  function scrollToField(field: string) {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-field="${field}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
    })
  }

  function goTo(target: DraftStep, replace = false) {
    const index = steps.value.indexOf(target)
    if (index < 0) return Promise.resolve()
    const query = { ...route.query, step: index === 0 ? undefined : String(index + 1) }
    window.scrollTo({ top: 0 })
    return replace ? router.replace({ query }) : router.push({ query })
  }

  /** «Далее»: shows what is missing on this step instead of moving on. */
  function next(): boolean {
    tried.add(step.value)
    const errors = errorsOf(step.value)
    if (errors.length) {
      scrollToField(errors[0]!.field)
      return false
    }
    const following = steps.value[stepIndex.value + 1]
    if (following) {
      if (following === 'review') steps.value.forEach((s) => tried.add(s))
      void goTo(following)
    }
    return true
  }

  function back() {
    const previous = steps.value[stepIndex.value - 1]
    if (previous) void goTo(previous)
  }

  /** «Исправить» on the review: to the step, at the field. */
  function fix(issue: DraftIssue) {
    tried.add(issue.step)
    void goTo(issue.step).then(() => scrollToField(issue.field))
  }

  // A pickup point has other steps: keep the seller on a step that exists.
  watch(steps, (list, before) => {
    if (before && list.join() !== before.join() && stepIndex.value >= list.length) {
      void goTo(list[list.length - 1]!, true)
    }
  })

  // ─── Publishing ────────────────────────────────────────────────────────────
  const language = computed(() => LANGUAGE_TAG[locale.value] ?? 'en-US')

  /** The offer as it will be sent; also what the preview shows. */
  const offer = computed<Offer | null>(() =>
    draft.value && me.value
      ? offerFromDraft(draft.value, {
          address: me.value,
          language: language.value,
          rates: rates.data.value ?? null,
          myList: account.isSuccess.value ? myList.value : undefined,
          base: editing.value ? (original.data.value ?? null) : null,
        })
      : null
  )

  const publishTxId = ref<string | null>(null)
  const publishTx = computed(() => txStore.items.find((tx) => tx.id === publishTxId.value) ?? null)
  const publishError = ref<string | null>(null)
  const sending = ref(false)

  const canPublish = computed(
    () =>
      state.value === 'ready' &&
      !blocking.value.length &&
      !waits.value.length &&
      !activating.value &&
      !pointForbidden.value &&
      !sending.value &&
      // Sent: a second press would publish a second offer.
      !published.value
  )

  async function publish(): Promise<boolean> {
    steps.value.forEach((s) => tried.add(s))
    publishError.value = null
    const first = blocking.value[0]
    if (first) {
      fix(first)
      return false
    }
    if (!canPublish.value || !offer.value) return false

    // Busy from the first press: a second one before the host answers is ignored.
    sending.value = true
    try {
      if (!(await session.ensureSignedIn()) || !offer.value) return false

      let payload
      try {
        payload = toOfferPayload(offer.value, {
          isLeafCategory: (tag) => categories.tree.value?.isLeaf(tag) ?? false,
        })
      } catch (error) {
        publishError.value =
          error instanceof OfferInvalidError ? `offer:invalid:${error.field}` : String(error)
        return false
      }

      // The draft is what goes now. A refused try of this new offer would stay
      // in «Публикуются» with a «Повторить» of its own: a second copy on chain.
      if (!editing.value) {
        txStore.items
          .filter((t) => t.kind === 'offer' && !t.target && t.status === 'failed')
          .forEach((t) => txStore.dismiss(t.id))
      }
      const tx = await txStore.send('offer', payload)
      publishTxId.value = tx.id
      if (tx.status === 'failed') {
        publishError.value = tx.error
        return false
      }
      // In the network now: the draft is no longer needed, nor is the video at risk.
      published.value = true
      clearTimeout(saveTimer)
      forgetStored()
      if (draft.value) draft.value.videoUploadedHere = false
      void client.invalidateQueries({ queryKey: ['barteron', 'offers-by', me.value] })
      return true
    } finally {
      sending.value = false
    }
  }

  /** The offer's page once it is sent: a new offer's id is its first txid. */
  const publishedId = computed(
    () => hash.value ?? publishTx.value?.target ?? publishTx.value?.txid ?? null
  )

  /** «Разместить ещё»: an empty form after a new offer went out. */
  function reset() {
    published.value = false
    publishTxId.value = null
    publishError.value = null
    tried.clear()
    originals.clear()
    start(fresh(), false)
    void goTo(stepsOf(draft.value!)[0]!, true)
  }

  onBeforeUnmount(() => {
    clearTimeout(saveTimer)
    clearInterval(profileTimer)
    // A change typed in the last 400 ms is kept too.
    save()
  })

  return {
    hash,
    editing,
    state,
    original,
    draft,
    restoredAt,
    savedAt,
    notKept,
    dirty,
    discard,
    activating,
    pointForbidden,
    myList,
    account,
    categories,
    rates,
    // video
    videosSupported,
    videoStatus,
    videoInfo: computed(() => video.data.value ?? null),
    videoBusy,
    addVideo,
    removeVideo,
    retryVideo: () => void video.refetch(),
    // photos
    photoNotice,
    unreadable,
    addPhotos,
    retryPhoto,
    removePhoto,
    movePhoto,
    takePhoto,
    // steps
    steps,
    stepIndex,
    step,
    tried,
    issues,
    blocking,
    waits,
    issueText,
    fieldError,
    errorsOf,
    goTo,
    next,
    back,
    fix,
    // publishing
    offer,
    canPublish,
    publish,
    sending,
    publishTx,
    publishError,
    published,
    publishedId,
    reset,
  }
}

export type OfferForm = ReturnType<typeof createOfferForm>

const FORM: InjectionKey<OfferForm> = Symbol('offer-form')

export function provideOfferForm(form: OfferForm) {
  provide(FORM, form)
}

export function useOfferForm(): OfferForm {
  const form = inject(FORM)
  if (!form) throw new Error('useOfferForm outside the offer form')
  return form
}
