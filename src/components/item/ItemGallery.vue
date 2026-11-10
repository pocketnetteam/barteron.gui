<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'
import type { GallerySlide } from './gallery'

/**
 * Offer photos and video (s3-item-desktop / s3-item-mobile). Computer: the
 * big photo with arrows and a row of thumbnails. Phone: full width, swiped
 * sideways, with dots. A click opens the viewer.
 */
const props = withDefaults(
  defineProps<{
    slides: GallerySlide[]
    title: string
    /** «Б/У» in the corner. */
    badge?: string | null
    /** Grey and faded: the offer is not active. */
    inactive?: boolean
    variant?: 'page' | 'own' | 'pickup'
  }>(),
  { variant: 'page' }
)
const emit = defineEmits<{ open: [index: number] }>()
const { t } = useI18n()

const index = ref(0)
const strip = ref<HTMLElement>()
const failed = ref(new Set<number>())
const count = computed(() => props.slides.length)
const current = computed(() => props.slides[index.value])

watch(
  () => props.slides,
  () => {
    index.value = 0
    failed.value = new Set()
  }
)

function go(next: number) {
  if (!count.value) return
  index.value = (next + count.value) % count.value
}

/** Phone strip: the dot follows the swipe. */
function onScroll() {
  const el = strip.value
  if (!el || !el.clientWidth) return
  index.value = Math.round(el.scrollLeft / el.clientWidth)
}

function srcOf(slide: GallerySlide | undefined): string | null {
  if (!slide) return null
  return slide.kind === 'image' ? slide.src : (slide.poster ?? null)
}

function onError(i: number) {
  failed.value = new Set(failed.value).add(i)
}

/** Own offer: one big photo and two small (pickup point: four), «+3 фото» on the last. */
const tileCount = computed(() => (props.variant === 'pickup' ? 5 : 3))
const ownTiles = computed(() => props.slides.slice(0, tileCount.value))
</script>

<template>
  <div class="gal" :class="[`gal--${variant}`, { 'gal--inactive': inactive }]">
    <!-- Own offer, computer: mosaic -->
    <div
      v-if="variant !== 'page'"
      class="gal__mosaic"
      :class="[
        `gal__mosaic--n${Math.min(count, tileCount)}`,
        { 'gal__mosaic--one': count <= 1, 'gal__mosaic--two': count === 2 },
      ]"
    >
      <button
        v-for="(slide, i) in ownTiles"
        :key="i"
        type="button"
        class="gal__tile"
        :class="{ 'gal__tile--main': i === 0 }"
        :aria-label="t('item.gallery.open', { n: i + 1, total: count })"
        @click="emit('open', i)"
      >
        <img
          v-if="srcOf(slide) && !failed.has(i)"
          :src="srcOf(slide)!"
          alt=""
          decoding="async"
          @error="onError(i)"
        />
        <UiIcon v-else class="gal__placeholder" name="image" :size="40" :stroke="1.4" />
        <span v-if="slide.kind === 'video'" class="gal__play"
          ><UiIcon name="play" :size="18"
        /></span>
        <span v-if="i === tileCount - 1 && count > tileCount" class="gal__more">{{
          t('item.gallery.morePhotos', { n: count - tileCount })
        }}</span>
      </button>
      <div v-if="!count" class="gal__tile gal__tile--main gal__tile--empty">
        <UiIcon class="gal__placeholder" name="image" :size="40" :stroke="1.4" />
      </div>
    </div>

    <template v-else>
      <!-- Computer: big photo -->
      <div class="gal__main">
        <button
          type="button"
          class="gal__stage"
          :disabled="!count"
          :aria-label="count ? t('item.gallery.open', { n: index + 1, total: count }) : title"
          @click="emit('open', index)"
        >
          <img
            v-if="srcOf(current) && !failed.has(index)"
            :key="index"
            :src="srcOf(current)!"
            :alt="title"
            decoding="async"
            @error="onError(index)"
          />
          <UiIcon v-else class="gal__placeholder" name="image" :size="56" :stroke="1.2" />
          <span v-if="current?.kind === 'video'" class="gal__play gal__play--big">
            <UiIcon name="play" :size="26" />
          </span>
        </button>
        <span v-if="badge" class="gal__badge">{{ badge }}</span>
        <template v-if="count > 1">
          <button
            type="button"
            class="gal__arrow gal__arrow--prev"
            :aria-label="t('item.gallery.prev')"
            @click="go(index - 1)"
          >
            <UiIcon name="chevron-left" :size="20" :stroke="2" />
          </button>
          <button
            type="button"
            class="gal__arrow gal__arrow--next"
            :aria-label="t('item.gallery.next')"
            @click="go(index + 1)"
          >
            <UiIcon name="chevron-right" :size="20" :stroke="2" />
          </button>
          <span class="gal__counter" aria-live="polite">{{ index + 1 }} / {{ count }}</span>
        </template>
      </div>

      <div v-if="count > 1" class="gal__thumbs">
        <button
          v-for="(slide, i) in slides"
          :key="i"
          type="button"
          class="gal__thumb"
          :class="{ 'gal__thumb--on': i === index }"
          :aria-label="t('item.gallery.show', { n: i + 1 })"
          :aria-current="i === index ? 'true' : undefined"
          @click="index = i"
        >
          <img
            v-if="srcOf(slide) && !failed.has(i)"
            :src="srcOf(slide)!"
            alt=""
            loading="lazy"
            decoding="async"
            @error="onError(i)"
          />
          <template v-if="slide.kind === 'video'">
            <span class="gal__play"><UiIcon name="play" :size="14" /></span>
            <span v-if="slide.duration" class="gal__duration">{{ slide.duration }}</span>
          </template>
        </button>
      </div>

      <!-- Phone: swiped strip -->
      <div class="gal__phone">
        <div ref="strip" class="gal__strip" @scroll.passive="onScroll">
          <button
            v-for="(slide, i) in slides.length ? slides : [null]"
            :key="i"
            type="button"
            class="gal__slide"
            :disabled="!slide"
            :aria-label="slide ? t('item.gallery.open', { n: i + 1, total: count }) : title"
            @click="slide && emit('open', i)"
          >
            <img
              v-if="srcOf(slide ?? undefined) && !failed.has(i)"
              :src="srcOf(slide ?? undefined)!"
              :alt="i === 0 ? title : ''"
              :loading="i ? 'lazy' : undefined"
              decoding="async"
              @error="onError(i)"
            />
            <UiIcon v-else class="gal__placeholder" name="image" :size="48" :stroke="1.2" />
            <span v-if="slide?.kind === 'video'" class="gal__play gal__play--big">
              <UiIcon name="play" :size="24" />
            </span>
          </button>
        </div>
        <span v-if="badge" class="gal__badge gal__badge--phone">{{ badge }}</span>
        <div v-if="count > 1" class="gal__dots" aria-hidden="true">
          <span
            v-for="i in Math.min(count, 8)"
            :key="i"
            class="gal__dot"
            :class="{ 'gal__dot--on': i - 1 === Math.min(index, 7) }"
          />
        </div>
        <div class="gal__overlay"><slot name="overlay" /></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.gal {
  position: relative;
}

.gal__main {
  position: relative;
}

.gal__stage,
.gal__slide,
.gal__tile {
  width: 100%;
  padding: 0;
  border: 0;
  background: var(--photo);
  color: var(--text3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: zoom-in;
}

.gal__stage:disabled,
.gal__slide:disabled {
  cursor: default;
}

.gal__stage {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-l);
}

.gal img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gal--inactive img {
  filter: grayscale(1);
  opacity: 0.6;
}

.gal__stage:focus-visible,
.gal__thumb:focus-visible,
.gal__tile:focus-visible,
.gal__arrow:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.gal__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 2px 8px;
  border-radius: var(--radius-s);
  background: var(--on-photo);
  color: #ffffff;
  font: 600 12px / 20px var(--font-sans);
  pointer-events: none;
}

.gal__arrow {
  position: absolute;
  top: 50%;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gal__arrow--prev {
  left: 12px;
}

.gal__arrow--next {
  right: 12px;
}

.gal__counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: var(--on-photo);
  color: #ffffff;
  font: 600 13px / 20px var(--font-sans);
  pointer-events: none;
}

.gal__thumbs {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.gal__thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-m);
  background: var(--photo);
  overflow: hidden;
}

.gal__thumb--on {
  border-color: var(--primary);
}

.gal__play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  margin: -16px 0 0 -16px;
  border-radius: var(--radius-full);
  background: var(--on-photo);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.gal__play--big {
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
}

.gal__duration {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 0 4px;
  border-radius: 4px;
  background: var(--on-photo);
  color: #ffffff;
  font: 600 11px / 16px var(--font-sans);
}

/* Own offer: mosaic of three */
.gal__mosaic {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  aspect-ratio: 852 / 422;
}

.gal__tile {
  position: relative;
  border-radius: var(--radius-l);
}

.gal__mosaic--one {
  grid-template-columns: 1fr !important;
  aspect-ratio: 852 / 480;
}

.gal__mosaic--two .gal__tile:nth-child(2) {
  grid-row: span 2;
}

.gal--pickup .gal__mosaic {
  grid-template-columns: 2fr 1fr 1fr;
  aspect-ratio: 852 / 312;
}

/* Fewer photos than tiles: the small ones grow to fill the grid. */
.gal--pickup .gal__mosaic--n2 .gal__tile:nth-child(2) {
  grid-column: span 2;
}

.gal--pickup .gal__mosaic--n3 .gal__tile:nth-child(n + 2),
.gal--pickup .gal__mosaic--n4 .gal__tile:nth-child(2) {
  grid-row: span 2;
}

.gal--pickup .gal__tile--empty {
  grid-column: span 3;
}

.gal__tile--main {
  grid-row: span 2;
}

.gal__tile--empty {
  grid-column: span 2;
  cursor: default;
}

.gal__more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay);
  color: #ffffff;
  font: 600 15px / 20px var(--font-sans);
}

/* Phone */
.gal__phone {
  display: none;
  position: relative;
}

.gal__strip {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.gal__strip::-webkit-scrollbar {
  display: none;
}

.gal__slide {
  position: relative;
  flex: none;
  aspect-ratio: 13 / 10;
  scroll-snap-align: start;
}

.gal__badge--phone {
  top: auto;
  bottom: 30px;
}

.gal__dots {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
}

.gal__dot {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  background: var(--on-photo-button);
  opacity: 0.55;
}

.gal__dot--on {
  opacity: 1;
}

.gal__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.gal__overlay > :deep(*) {
  pointer-events: auto;
}

.gal__placeholder {
  color: var(--text3);
}

@media (max-width: 767px) {
  .gal--page .gal__main,
  .gal--page .gal__thumbs {
    display: none;
  }

  .gal--page .gal__phone {
    display: block;
  }

  .gal__mosaic {
    aspect-ratio: 4 / 3;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  .gal__mosaic .gal__tile:not(.gal__tile--main) {
    display: none;
  }
}
</style>
