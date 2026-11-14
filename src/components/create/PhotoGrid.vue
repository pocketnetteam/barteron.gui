<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOfferForm } from '@/composables/offer-form'
import { PHOTO_TYPES } from '@/lib/image'
import { MAX_PHOTOS, type DraftPhoto } from '@/models/draft'
import { useSessionStore } from '@/stores/session'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'
import UiIcon from '@/ui/UiIcon.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

/**
 * Photos of the offer (s4-step2, s4-media-mobile). Each one uploads as soon
 * as it is added; the first is the cover. Reordering: drag with the mouse, or
 * hold a photo on a touch screen and drag; a tap makes it the cover. Pictures
 * can also be dropped onto the grid or pasted from the clipboard.
 */
const { t, locale } = useI18n()
const form = useOfferForm()
const session = useSessionStore()
const photos = computed<DraftPhoto[]>(() => form.draft.value?.photos ?? [])
const full = computed(() => photos.value.length >= MAX_PHOTOS)

const fileInput = ref<HTMLInputElement>()
const cameraInput = ref<HTMLInputElement>()
const accept = PHOTO_TYPES.join(',')

const src = (photo: DraftPhoto) =>
  photo.url ? (session.sdk?.manageBastyonImageSrc(photo.url) ?? photo.url) : (photo.data ?? '')

const totalBytes = computed(() => photos.value.reduce((sum, p) => sum + p.bytes, 0))
const sizeKnown = computed(() => photos.value.length > 0 && photos.value.every((p) => p.bytes > 0))
/** «4,2 МБ»; below a megabyte — «640 КБ». */
const size = computed(() => {
  const kb = totalBytes.value / 1024
  const mb = kb >= 1024
  return new Intl.NumberFormat(locale.value, {
    style: 'unit',
    unit: mb ? 'megabyte' : 'kilobyte',
    maximumFractionDigits: mb ? 1 : 0,
  }).format(mb ? kb / 1024 : Math.max(1, kb))
})

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement
  const files = [...(input.files ?? [])]
  input.value = ''
  if (files.length) void form.addPhotos(files)
}

/** Bastyon's camera on a phone; elsewhere the browser's camera picker. */
function camera() {
  const device = String(session.appinfo?.device ?? '')
  if (session.mode === 'bastyon' && /android|ios|iphone|ipad/i.test(device)) {
    void form.takePhoto()
    return
  }
  cameraInput.value?.click()
}

/** «Не открылось: IMG_0001.HEIC, scan.jpg»; camera pictures have no name. */
const unreadable = computed(() => {
  const all = form.unreadable.value
  if (!all.length) return null
  const names = all.filter(Boolean)
  return names.length
    ? t('create.media.unreadable', { names: names.join(', ') })
    : t('create.media.unreadableNoName')
})

// Paste and drop
function onPaste(event: ClipboardEvent) {
  const files = [...(event.clipboardData?.items ?? [])]
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((f): f is File => !!f)
  if (!files.length) return
  event.preventDefault()
  void form.addPhotos(files)
}
onMounted(() => window.addEventListener('paste', onPaste))
onBeforeUnmount(() => window.removeEventListener('paste', onPaste))

const dropping = ref(false)
function onDragOver(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) return
  event.preventDefault()
  dropping.value = true
}
function onDrop(event: DragEvent) {
  dropping.value = false
  const files = [...(event.dataTransfer?.files ?? [])]
  if (!files.length) return
  event.preventDefault()
  void form.addPhotos(files)
}

// Reordering with a pointer: mouse after a few pixels, touch after a hold.
const HOLD_MS = 350
const dragFrom = ref<number | null>(null)
const dragOver = ref<number | null>(null)
let gesture: {
  index: number
  x: number
  y: number
  touch: boolean
  started: number
  hold?: ReturnType<typeof setTimeout>
} | null = null

function indexAt(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-photo-index]')
  return el ? Number(el.dataset.photoIndex) : null
}

function beginDrag() {
  if (!gesture) return
  dragFrom.value = gesture.index
  dragOver.value = gesture.index
  navigator.vibrate?.(10)
}

function onPointerDown(event: PointerEvent, index: number) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return
  if (photos.value[index]?.status !== 'ready') return
  const touch = event.pointerType !== 'mouse'
  gesture = { index, x: event.clientX, y: event.clientY, touch, started: Date.now() }
  if (touch) gesture.hold = setTimeout(beginDrag, HOLD_MS)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', endGesture)
  window.addEventListener('touchmove', blockScroll, { passive: false })
}

function onPointerMove(event: PointerEvent) {
  if (!gesture) return
  const moved = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y)
  if (dragFrom.value === null) {
    if (!gesture.touch && moved > 6) beginDrag()
    // A finger moving before the hold is a scroll.
    else if (gesture.touch && moved > 10) endGesture()
    return
  }
  event.preventDefault()
  dragOver.value = indexAt(event.clientX, event.clientY) ?? dragOver.value
}

function onPointerUp(event: PointerEvent) {
  const g = gesture
  const from = dragFrom.value
  const to = dragOver.value
  endGesture()
  if (!g) return
  if (from !== null && to !== null) form.movePhoto(from, to)
  // A tap on a phone makes the photo the cover.
  else if (g.touch && Date.now() - g.started < HOLD_MS && g.index > 0) form.movePhoto(g.index, 0)
  void event
}

function blockScroll(event: TouchEvent) {
  if (dragFrom.value !== null) event.preventDefault()
}

function endGesture() {
  if (gesture?.hold) clearTimeout(gesture.hold)
  gesture = null
  dragFrom.value = null
  dragOver.value = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', endGesture)
  window.removeEventListener('touchmove', blockScroll)
}
onBeforeUnmount(endGesture)
</script>

<template>
  <section class="pg" data-field="photos" :aria-label="t('create.media.photos')">
    <div class="pg__head">
      <h2 class="pg__title">{{ t('create.media.photos') }}</h2>
      <span class="pg__count tabular" data-testid="create-photo-count">
        {{ t('create.media.count', { n: photos.length, max: MAX_PHOTOS })
        }}<template v-if="sizeKnown"> · {{ size }}</template>
      </span>
    </div>

    <ul
      class="pg__grid"
      :class="{ 'pg__grid--drop': dropping, 'pg__grid--dragging': dragFrom !== null }"
      @dragover="onDragOver"
      @dragleave="dropping = false"
      @drop="onDrop"
    >
      <li
        v-for="(photo, i) in photos"
        :key="photo.id"
        class="pg__tile"
        :class="[
          `pg__tile--${photo.status}`,
          {
            'pg__tile--main': i === 0 && photo.status === 'ready',
            'pg__tile--from': dragFrom === i,
            'pg__tile--over': dragOver === i && dragFrom !== null && dragFrom !== i,
          },
        ]"
        :data-photo-index="i"
        :data-testid="`create-photo-${photo.status}`"
        :aria-label="t('create.media.photoN', { n: i + 1 })"
        @pointerdown="onPointerDown($event, i)"
      >
        <img
          v-if="photo.status !== 'failed' && src(photo)"
          class="pg__img"
          :src="src(photo)"
          alt=""
          draggable="false"
        />

        <span v-if="i === 0 && photo.status === 'ready'" class="pg__badge">
          {{ t('create.media.main') }}
        </span>

        <span v-if="photo.status === 'uploading'" class="pg__state">
          <UiSpinner :size="20" />{{ t('create.media.uploading') }}
        </span>
        <span v-else-if="photo.status === 'failed'" class="pg__state pg__state--failed">
          <UiIcon name="error" :size="20" :stroke="2" />
          {{ t('create.media.failed') }}
          <button
            v-if="photo.data"
            type="button"
            class="pg__retry"
            data-testid="create-photo-retry"
            @click="form.retryPhoto(photo.id)"
          >
            {{ t('create.media.retry') }}
          </button>
        </span>

        <span class="pg__actions">
          <button
            v-if="i > 0"
            type="button"
            class="pg__act pg__act--kb"
            :aria-label="t('create.media.moveLeft')"
            @click="form.movePhoto(i, i - 1)"
          >
            <UiIcon name="chevron-left" :size="16" :stroke="2.4" />
          </button>
          <button
            v-if="i < photos.length - 1"
            type="button"
            class="pg__act pg__act--kb"
            :aria-label="t('create.media.moveRight')"
            @click="form.movePhoto(i, i + 1)"
          >
            <UiIcon name="chevron-right" :size="16" :stroke="2.4" />
          </button>
          <button
            type="button"
            class="pg__act pg__act--remove"
            :aria-label="t('create.media.remove')"
            data-testid="create-photo-remove"
            @click="form.removePhoto(photo.id)"
          >
            <UiIcon name="delete" :size="16" :stroke="2" />
          </button>
        </span>
        <button
          v-if="i > 0 && photo.status === 'ready'"
          type="button"
          class="pg__make-main"
          @click="form.movePhoto(i, 0)"
        >
          {{ t('create.media.makeMain') }}
        </button>
      </li>

      <li v-if="!full" class="pg__add-cell">
        <button
          type="button"
          class="pg__add"
          data-testid="create-photo-add"
          @click="fileInput?.click()"
        >
          <UiIcon name="photo" :size="22" />
          <span>{{ dropping ? t('create.media.drop') : t('create.media.add') }}</span>
        </button>
      </li>
    </ul>

    <div v-if="!full" class="pg__phone-buttons">
      <UiButton variant="secondary" :size="52" icon="photo" block @click="camera">
        {{ t('create.media.camera') }}
      </UiButton>
      <UiButton variant="neutral" :size="52" block @click="fileInput?.click()">
        {{ t('create.media.gallery') }}
      </UiButton>
    </div>

    <input
      ref="fileInput"
      class="visually-hidden"
      type="file"
      multiple
      :accept="accept"
      tabindex="-1"
      aria-hidden="true"
      data-testid="create-photo-input"
      @change="onFiles"
    />
    <input
      ref="cameraInput"
      class="visually-hidden"
      type="file"
      accept="image/*"
      capture="environment"
      tabindex="-1"
      aria-hidden="true"
      @change="onFiles"
    />

    <UiAlert
      v-if="form.photoNotice.value?.kind === 'limit'"
      tone="warning"
      icon="warning"
      data-testid="create-photo-limit"
    >
      {{
        t('create.media.limit', {
          added: form.photoNotice.value.added,
          total: form.photoNotice.value.total,
        })
      }}
    </UiAlert>
    <UiAlert v-else-if="form.photoNotice.value?.kind === 'type'" tone="warning" icon="warning">
      {{ t('create.media.type') }}
    </UiAlert>
    <UiAlert v-if="unreadable" tone="warning" icon="warning" data-testid="create-photo-unreadable">
      {{ unreadable }}
    </UiAlert>

    <p v-if="form.fieldError('photos')" class="pg__error" role="alert">
      <UiIcon name="error" :size="14" :stroke="2" />{{ form.fieldError('photos') }}
    </p>
    <p class="pg__hint pg__hint--desk">{{ t('create.media.hint') }}</p>
    <p class="pg__hint pg__hint--phone">
      {{ t('create.media.count', { n: photos.length, max: MAX_PHOTOS }) }} ·
      {{ t('create.media.hintPhone') }}
    </p>
  </section>
</template>

<style scoped>
.pg {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pg__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.pg__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.pg__count {
  font-size: 13px;
  color: var(--text3);
}

.pg__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  border-radius: 16px;
}

.pg__grid--drop {
  outline: 2px dashed var(--primary);
  outline-offset: 4px;
}

.pg__grid--dragging {
  user-select: none;
}

.pg__tile {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 14px;
  overflow: hidden;
  background: var(--muted);
  touch-action: pan-y;
  user-select: none;
  -webkit-touch-callout: none;
}

.pg__tile--ready {
  cursor: grab;
}

.pg__tile--main {
  outline: 2px solid var(--primary);
  outline-offset: -2px;
}

.pg__tile--from {
  opacity: 0.45;
}

.pg__tile--over {
  outline: 2px dashed var(--primary);
  outline-offset: 2px;
}

.pg__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.pg__tile--uploading .pg__img {
  opacity: 0.4;
}

.pg__badge {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
}

.pg__state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text2);
}

.pg__state--failed {
  background: var(--danger-soft);
  color: var(--danger);
  font-weight: 500;
}

.pg__retry {
  border: 0;
  background: transparent;
  padding: 2px 6px;
  color: var(--link);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
}

.pg__actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--duration);
}

.pg__tile:hover .pg__actions,
.pg__tile:focus-within .pg__actions,
.pg__tile--failed .pg__actions {
  opacity: 1;
}

.pg__act {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-1);
  cursor: pointer;
}

.pg__act--remove {
  color: var(--danger);
}

/* Moving by keyboard only: the buttons show when focused. */
.pg__act--kb {
  display: none;
}

.pg__tile:focus-within .pg__act--kb {
  display: flex;
}

.pg__act:focus-visible,
.pg__make-main:focus-visible,
.pg__retry:focus-visible,
.pg__add:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.pg__make-main {
  position: absolute;
  left: 8px;
  bottom: 8px;
  height: 24px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  box-shadow: var(--shadow-1);
  opacity: 0;
  cursor: pointer;
}

.pg__tile:hover .pg__make-main,
.pg__tile:focus-within .pg__make-main {
  opacity: 1;
}

.pg__add-cell {
  aspect-ratio: 4 / 3;
}

.pg__add {
  width: 100%;
  height: 100%;
  border: 1.5px dashed var(--border-strong);
  border-radius: 14px;
  background: transparent;
  color: var(--text2);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.pg__add:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.pg__phone-buttons {
  display: none;
}

.pg__error {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  color: var(--danger);
}

.pg__hint {
  margin: 0;
  font-size: 13px;
  line-height: 19px;
  color: var(--text2);
}

.pg__hint--phone {
  display: none;
}

@media (hover: none) {
  .pg__actions {
    opacity: 1;
  }

  .pg__act--kb,
  .pg__make-main {
    display: none;
  }

  .pg__act--remove {
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    background: rgb(0 0 0 / 55%);
    color: #ffffff;
    box-shadow: none;
  }
}

@media (max-width: 767px) {
  .pg__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .pg__tile {
    aspect-ratio: 1;
  }

  .pg__add-cell {
    display: none;
  }

  .pg__phone-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .pg__hint--desk {
    display: none;
  }

  .pg__hint--phone {
    display: block;
  }
}
</style>
