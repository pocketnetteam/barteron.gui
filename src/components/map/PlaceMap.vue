<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LatLng } from '@/lib/geohash'
import { useSessionStore } from '@/stores/session'
import { addTiles, loadLeaflet, type L } from './leaflet'

/**
 * The offer's point (s4-step4): a tap puts the marker, the marker can be
 * dragged. As in the old form, a new offer has no marker until the seller
 * places it. `locked` — pickup points are chosen around it, so it stays put.
 */
const props = withDefaults(
  defineProps<{
    point: LatLng | null
    /** Where the map opens without a point. */
    center: LatLng
    locked?: boolean
    height?: number
    label: string
  }>(),
  { locked: false, height: 260 }
)
const emit = defineEmits<{ 'update:point': [point: LatLng] }>()

const { t } = useI18n()
const session = useSessionStore()
const el = ref<HTMLElement>()
const failed = ref(false)
const map = shallowRef<Leaflet.Map>()
let leaflet: L | null = null
let marker: Leaflet.Marker | null = null

const PIN =
  '<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true"><path d="M16 39s13-12.4 13-23A13 13 0 0 0 3 16c0 10.6 13 23 13 23z" fill="currentColor"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>'

function place(point: LatLng | null, recenter: boolean) {
  const m = map.value
  if (!m || !leaflet) return
  if (!point) {
    marker?.remove()
    marker = null
    return
  }
  if (!marker) {
    marker = leaflet
      .marker(point, {
        draggable: !props.locked,
        keyboard: false,
        icon: leaflet.divIcon({
          className: 'plm-pin',
          html: PIN,
          iconSize: [32, 40],
          iconAnchor: [16, 39],
        }),
      })
      .addTo(m)
    marker.on('dragend', () => {
      const at = marker!.getLatLng()
      emit('update:point', [at.lat, at.lng])
    })
  } else marker.setLatLng(point)
  if (recenter) m.setView(point, Math.max(m.getZoom(), 15))
}

onMounted(async () => {
  try {
    leaflet = await loadLeaflet()
  } catch {
    failed.value = true
    return
  }
  if (!el.value) return
  map.value = leaflet.map(el.value, {
    zoomControl: true,
    attributionControl: session.mode === 'bastyon',
    scrollWheelZoom: false,
  })
  map.value.setView(props.point ?? props.center, props.point ? 15 : 11)
  addTiles(leaflet, map.value, session.mode === 'bastyon')
  map.value.on('click', (event: Leaflet.LeafletMouseEvent) => {
    if (props.locked) return
    emit('update:point', [event.latlng.lat, event.latlng.lng])
  })
  place(props.point, false)
})

// A point from the search or «Где я» moves the view there; a drag does not.
watch(
  () => props.point,
  (point, before) => {
    const moved =
      !before || !point || Math.abs(point[0] - before[0]) + Math.abs(point[1] - before[1]) > 0.002
    place(point, moved)
  }
)
watch(
  () => props.locked,
  (locked) => {
    if (!marker) return
    if (locked) marker.dragging?.disable()
    else marker.dragging?.enable()
  }
)
onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <div class="plm" :style="{ height: `${height}px` }">
    <div
      ref="el"
      class="plm__canvas"
      role="application"
      :aria-label="label"
      data-testid="create-map"
    />
    <span v-if="!locked && !failed" class="plm__tip">
      {{ point ? t('create.place.drag') : t('create.place.tapMap') }}
    </span>
    <p v-if="failed" class="plm__failed">{{ t('location.mapFailed') }}</p>
  </div>
</template>

<style scoped>
.plm {
  position: relative;
  /* Leaflet's panes and controls stay under dialogs. */
  isolation: isolate;
  border-radius: 16px;
  overflow: hidden;
  background: var(--map-land);
}

.plm__canvas {
  position: absolute;
  inset: 0;
}

.plm__tip {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 500;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--surface);
  color: var(--text2);
  font-size: 12px;
  box-shadow: var(--shadow-1);
  pointer-events: none;
}

.plm__failed {
  position: absolute;
  inset: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text2);
  font-size: 14px;
}

.plm :deep(.plm-pin) {
  color: var(--primary);
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 30%));
}
</style>
