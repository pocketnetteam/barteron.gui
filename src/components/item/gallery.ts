import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { isJsonObject } from '@/models/tx'
import { useSessionStore } from '@/stores/session'

export type VideoStatus = 'loading' | 'ready' | 'processing' | 'failed' | 'missing'

export interface VideoSlide {
  kind: 'video'
  /** HLS playlist (`.m3u8`) once the host knows the video. */
  playlist: string | null
  poster: string | null
  /** «0:42» */
  duration: string | null
  status: VideoStatus
}

/** One slide of the offer gallery: a photo or the offer's video. */
export type GallerySlide = { kind: 'image'; src: string } | VideoSlide

/**
 * Photos and the video in the order the seller chose: the old app put the
 * video first unless `videoSettings.order` is `last` (item/index.js:413).
 */
export function gallerySlides(
  images: readonly string[],
  video: VideoSlide | null,
  order: unknown
): GallerySlide[] {
  const photos: GallerySlide[] = images.map((src) => ({ kind: 'image', src }))
  if (!video) return photos
  return order === 'last' ? [...photos, video] : [video, ...photos]
}

const clock = (seconds: unknown): string | null => {
  const s = typeof seconds === 'number' && seconds > 0 ? Math.round(seconds) : 0
  return s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : null
}

/** The host gives the poster and the video server the playlist as full http(s) addresses. */
const webUrl = (value: unknown): string | null =>
  typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null

/**
 * What `sdk.get.videos([url])` says about one video (old `getVideoInfo`):
 * PeerTube `state.id` 1 — ready, 2/3 — transcoding, 7 — failed.
 */
export function parseVideoInfo(answer: unknown): Omit<VideoSlide, 'kind'> {
  const item = Array.isArray(answer) ? answer[0] : null
  const data = isJsonObject(item) && isJsonObject(item.data) ? item.data : null
  if (!data) return { playlist: null, poster: null, duration: null, status: 'missing' }
  const original = isJsonObject(data.original) ? data.original : {}
  const state = isJsonObject(original.state) ? original.state.id : undefined
  const lists = Array.isArray(original.streamingPlaylists) ? original.streamingPlaylists : []
  const first = isJsonObject(lists[0]) ? lists[0] : {}
  const playlist = webUrl(first.playlistUrl)
  // Something else than a web address (`javascript:`, `data:`) is not played.
  const odd = typeof first.playlistUrl === 'string' && !!first.playlistUrl && !playlist
  const status: VideoStatus =
    state === 7 || odd ? 'failed' : state === 2 || state === 3 || !playlist ? 'processing' : 'ready'
  return {
    playlist,
    poster: webUrl(data.thumbnail),
    duration: clock(original.duration),
    status,
  }
}

/** The offer's video for the gallery; `null` without one. Hosts before tx API 4 have no videos. */
export function useOfferVideo(url: MaybeRefOrGetter<string | null | undefined>) {
  const session = useSessionStore()
  const enabled = computed(
    () => !!session.sdk && !!toValue(url) && (session.appinfo?.transactionsApiVersion ?? 4) >= 4
  )
  const query = useQuery({
    queryKey: computed(() => ['bastyon', 'video', toValue(url) ?? null]),
    enabled,
    staleTime: 10 * 60_000,
    retry: 1,
    queryFn: async () => parseVideoInfo(await session.sdk!.get.videos([toValue(url)!])),
  })
  const slide = computed<VideoSlide | null>(() => {
    if (!enabled.value) return null
    if (query.isPending.value) {
      return { kind: 'video', playlist: null, poster: null, duration: null, status: 'loading' }
    }
    if (query.isError.value) {
      return { kind: 'video', playlist: null, poster: null, duration: null, status: 'failed' }
    }
    return { kind: 'video', ...query.data.value! }
  })
  return { slide, retry: () => void query.refetch() }
}
