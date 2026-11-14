<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LatLng } from '@/lib/geohash'
import { useSessionStore } from '@/stores/session'
import { addTiles, loadLeaflet, type L } from './leaflet'

/**
 * Small map of the search area: the circle stays in the middle, dragging the
 * map moves the centre («Двигайте карту, чтобы сменить центр»).
 */
const props = withDefaults(
  defineProps<{ center: LatLng; radiusKm: number; interactive?: boolean; height?: number }>(),
  { interactive: true, height: 220 }
)
const emit = defineEmits<{ 'update:center': [center: LatLng] }>()

const { t } = useI18n()
const session = useSessionStore()
const el = ref<HTMLElement>()
const failed = ref(false)
const map = shallowRef<Leaflet.Map>()
let leaflet: L | null = null
let circle: Leaflet.Circle | null = null
let dot: Leaflet.CircleMarker | null = null
/** Last centre we emitted or applied, to avoid loops. */
let current: LatLng = props.center

function fit(animate = false) {
  if (!map.value || !circle) return
  map.value.fitBounds(circle.getBounds(), { padding: [12, 12], animate })
}

onMounted(async () => {
  try {
    leaflet = await loadLeaflet()
  } catch {
    failed.value = true
    return
  }
  if (!el.value) return
  const m = leaflet.map(el.value, {
    zoomControl: false,
    attributionControl: session.mode === 'bastyon',
    dragging: props.interactive,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
  })
  m.setView(props.center, 11)
  addTiles(leaflet, m, session.mode === 'bastyon')
  const style = getComputedStyle(el.value)
  const primary = style.getPropertyValue('--primary').trim() || '#5b3cf0'
  circle = leaflet
    .circle(props.center, {
      radius: props.radiusKm * 1000,
      color: primary,
      weight: 2,
      fillColor: primary,
      fillOpacity: 0.1,
      interactive: false,
    })
    .addTo(m)
  dot = leaflet
    .circleMarker(props.center, {
      radius: 6,
      color: '#ffffff',
      weight: 2,
      fillColor: primary,
      fillOpacity: 1,
      interactive: false,
    })
    .addTo(m)
  m.on('move', () => {
    const c = m.getCenter()
    circle?.setLatLng(c)
    dot?.setLatLng(c)
  })
  m.on('moveend', () => {
    const c = m.getCenter()
    const next: LatLng = [c.lat, c.lng]
    if (Math.abs(next[0] - current[0]) < 1e-6 && Math.abs(next[1] - current[1]) < 1e-6) return
    current = next
    emit('update:center', next)
  })
  map.value = m
  fit()
})

watch(
  () => props.center,
  (center) => {
    if (!map.value || (center[0] === current[0] && center[1] === current[1])) return
    current = center
    circle?.setLatLng(center)
    dot?.setLatLng(center)
    map.value.setView(center, map.value.getZoom(), { animate: false })
    fit()
  }
)

watch(
  () => props.radiusKm,
  (radius) => {
    circle?.setRadius(radius * 1000)
    fit(true)
  }
)

onBeforeUnmount(() => {
  map.value?.remove()
})
</script>

<template>
  <div class="area-map" :style="{ height: `${height}px` }">
    <div ref="el" class="area-map__canvas" :aria-label="t('location.mapLabel')" role="img" />
    <p v-if="interactive && !failed" class="area-map__hint">{{ t('location.dragHint') }}</p>
    <p v-if="failed" class="area-map__failed">{{ t('location.mapFailed') }}</p>
  </div>
</template>

<style scoped>
.area-map {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-m);
  background: var(--map-land);
  isolation: isolate;
}

.area-map__canvas {
  position: absolute;
  inset: 0;
  background: var(--map-land);
}

.area-map__hint {
  position: absolute;
  z-index: 500;
  right: 10px;
  bottom: 10px;
  margin: 0;
  padding: 4px 8px;
  border-radius: var(--radius-s);
  /* Chrome 89 and Safari 15 have no color-mix(): an opaque plate there. */
  background: var(--surface);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  color: var(--text2);
  font-size: 12px;
  line-height: 16px;
  pointer-events: none;
}

.area-map__failed {
  position: absolute;
  inset: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
  font-size: 13px;
}
</style>
