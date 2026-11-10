<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSpinner from '@/ui/UiSpinner.vue'
import type { GallerySlide } from './gallery'

/**
 * Photos on a dark background, full screen (s3-item-dialogs «Просмотр фото»).
 * Arrows, keys ← → and Escape; thumbnails at the bottom. The video plays here.
 */
const props = defineProps<{ slides: GallerySlide[]; title: string }>()
const open = defineModel<boolean>('open', { default: false })
const index = defineModel<number>('index', { default: 0 })
const emit = defineEmits<{ retryVideo: [] }>()
const { t } = useI18n()

const panel = ref<HTMLElement>()
const count = computed(() => props.slides.length)
const current = computed(() => props.slides[index.value])
let returnFocus: HTMLElement | null = null

function go(next: number) {
  if (count.value) index.value = (next + count.value) % count.value
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') go(index.value - 1)
  else if (event.key === 'ArrowRight') go(index.value + 1)
}

/** HLS: Safari plays it itself, elsewhere hls.js (own chunk, loaded on demand). */
const videoEl = ref<HTMLVideoElement>()
const hls = shallowRef<{ destroy(): void } | null>(null)

function stopVideo() {
  hls.value?.destroy()
  hls.value = null
}

watch(
  [() => (current.value?.kind === 'video' ? current.value.playlist : null), videoEl],
  async ([playlist, el]) => {
    stopVideo()
    if (!playlist || !el) return
    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = playlist
      return
    }
    const { default: Hls } = await import('hls.js')
    if (!Hls.isSupported() || videoEl.value !== el) return
    const player = new Hls()
    player.loadSource(playlist)
    player.attachMedia(el)
    hls.value = player
  }
)

/** Swipe on the phone. */
let startX: number | null = null
function onTouchStart(event: TouchEvent) {
  startX = event.touches[0]?.clientX ?? null
}
function onTouchEnd(event: TouchEvent) {
  const endX = event.changedTouches[0]?.clientX
  if (startX === null || endX === undefined) return
  const dx = endX - startX
  if (Math.abs(dx) > 40) go(index.value + (dx < 0 ? 1 : -1))
  startX = null
}

watch(
  open,
  async (value) => {
    document.documentElement.style.overflow = value ? 'hidden' : ''
    if (value) {
      returnFocus = document.activeElement as HTMLElement | null
      await nextTick()
      panel.value?.focus()
    } else {
      returnFocus?.focus?.()
      returnFocus = null
    }
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  stopVideo()
  document.documentElement.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="pv">
      <div
        v-if="open"
        ref="panel"
        class="pv"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        data-testid="photo-viewer"
        @keydown.esc.stop="open = false"
        @keydown="onKey"
      >
        <div class="pv__head">
          <span class="pv__counter" aria-live="polite">{{ index + 1 }} / {{ count }}</span>
          <button type="button" class="pv__round" :aria-label="t('ui.close')" @click="open = false">
            <UiIcon name="close" :size="22" :stroke="2" />
          </button>
        </div>

        <div class="pv__stage" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
          <template v-if="current?.kind === 'video'">
            <video
              v-if="current.status === 'ready'"
              ref="videoEl"
              :key="current.playlist ?? ''"
              class="pv__media"
              :poster="current.poster ?? undefined"
              :aria-label="t('offer.video')"
              controls
              autoplay
              playsinline
            />
            <div v-else class="pv__video-state">
              <UiSpinner
                v-if="current.status === 'loading' || current.status === 'processing'"
                :size="28"
              />
              <UiIcon v-else name="error" :size="28" />
              <p>{{ t(`item.video.${current.status}`) }}</p>
              <UiButton
                v-if="current.status === 'failed'"
                variant="secondary"
                :size="36"
                @click="emit('retryVideo')"
              >
                {{ t('net.retry') }}
              </UiButton>
            </div>
          </template>
          <img
            v-else-if="current"
            :key="index"
            class="pv__media"
            :src="current.src"
            :alt="index === 0 ? title : ''"
          />
          <template v-if="count > 1">
            <button
              type="button"
              class="pv__round pv__arrow pv__arrow--prev"
              :aria-label="t('item.gallery.prev')"
              @click="go(index - 1)"
            >
              <UiIcon name="chevron-left" :size="22" :stroke="2" />
            </button>
            <button
              type="button"
              class="pv__round pv__arrow pv__arrow--next"
              :aria-label="t('item.gallery.next')"
              @click="go(index + 1)"
            >
              <UiIcon name="chevron-right" :size="22" :stroke="2" />
            </button>
          </template>
        </div>

        <div v-if="count > 1" class="pv__thumbs">
          <button
            v-for="(slide, i) in slides"
            :key="i"
            type="button"
            class="pv__thumb"
            :class="{ 'pv__thumb--on': i === index }"
            :aria-label="t('item.gallery.show', { n: i + 1 })"
            :aria-current="i === index ? 'true' : undefined"
            @click="index = i"
          >
            <img v-if="slide.kind === 'image'" :src="slide.src" alt="" loading="lazy" />
            <img v-else-if="slide.poster" :src="slide.poster" alt="" loading="lazy" />
            <UiIcon v-if="slide.kind === 'video'" class="pv__thumb-play" name="play" :size="14" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Always dark, in both themes: photos read best on black. */
.pv {
  position: fixed;
  z-index: var(--z-modal);
  inset: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
  background: #0b0b10;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  outline: none;
}

.pv__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* The host close button may sit at the top right (lib/host-insets.ts). */
  padding-right: max(0px, calc(var(--host-corner, 0px) - 20px));
}

.pv__counter {
  font: 600 15px / 20px var(--font-sans);
}

.pv__round {
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: rgb(255 255 255 / 12%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv__round:hover {
  background: rgb(255 255 255 / 20%);
}

.pv__round:focus-visible,
.pv__thumb:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.pv__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pv__media {
  max-width: min(100%, 1100px);
  max-height: 100%;
  border-radius: var(--radius-m);
  object-fit: contain;
}

.pv__video-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgb(255 255 255 / 80%);
  text-align: center;
}

.pv__arrow {
  position: absolute;
  top: 50%;
  margin-top: -22px;
}

.pv__arrow--prev {
  left: 0;
}

.pv__arrow--next {
  right: 0;
}

.pv__thumbs {
  display: flex;
  justify-content: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.pv__thumb {
  position: relative;
  flex: none;
  width: 48px;
  height: 36px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #2a2a33;
  overflow: hidden;
}

.pv__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pv__thumb--on {
  border-color: #ffffff;
}

.pv__thumb-play {
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -7px 0 0 -7px;
  color: #ffffff;
}

.pv-enter-active,
.pv-leave-active {
  transition: opacity var(--duration);
}

.pv-enter-from,
.pv-leave-to {
  opacity: 0;
}

@media (max-width: 767px) {
  .pv {
    padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
  }

  .pv__arrow {
    display: none;
  }
}
</style>
