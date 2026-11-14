<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LatLng } from '@/lib/geohash'
import { escapeHtml } from '@/lib/text'
import { useSessionStore } from '@/stores/session'
import { addTiles, loadLeaflet, type L } from './leaflet'

export interface MapPoint {
  id: string
  at: LatLng
  /** «60» — on the pill; empty — a dot. */
  label?: string
}

/**
 * A still map for the offer page: pickup points as pills (s3-item «Способы
 * получения», s3-pickup «Адрес») or the offer's area as a circle
 * («Местоположение»). Clicking a pill picks the point.
 */
const props = withDefaults(
  defineProps<{
    points?: readonly MapPoint[]
    selected?: string | null
    /** The offer's area: the exact address is not shown. */
    circle?: { center: LatLng; radiusKm: number } | null
    height?: number
    label: string
  }>(),
  { points: () => [], selected: null, circle: null, height: 256 }
)
const emit = defineEmits<{ select: [id: string] }>()

const { t } = useI18n()
const session = useSessionStore()
const el = ref<HTMLElement>()
const failed = ref(false)
const map = shallowRef<Leaflet.Map>()
let leaflet: L | null = null
let layer: Leaflet.LayerGroup | null = null

function draw() {
  const m = map.value
  if (!m || !leaflet || !el.value) return
  layer?.remove()
  layer = leaflet.layerGroup().addTo(m)
  const primary = getComputedStyle(el.value).getPropertyValue('--primary').trim() || '#5b3cf0'
  const bounds: LatLng[] = []

  if (props.circle) {
    const c = leaflet
      .circle(props.circle.center, {
        radius: props.circle.radiusKm * 1000,
        color: primary,
        weight: 2,
        fillColor: primary,
        fillOpacity: 0.12,
        interactive: false,
      })
      .addTo(layer)
    const b = c.getBounds()
    bounds.push([b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()])
  }

  for (const p of props.points) {
    const on = p.id === props.selected
    const marker = leaflet
      .marker(p.at, {
        keyboard: false,
        title: p.label ?? '',
        icon: leaflet.divIcon({
          className: 'pmap-wrap',
          html: `<span class="pmap-pin${on ? ' pmap-pin--on' : ''}${p.label ? '' : ' pmap-pin--dot'}"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/></svg>${p.label ? escapeHtml(p.label) : ''}</span>`,
        }),
      })
      .addTo(layer)
    marker.on('click', () => emit('select', p.id))
    bounds.push(p.at)
  }

  if (bounds.length === 1) m.setView(bounds[0]!, 14)
  else if (bounds.length) m.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 })
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
    zoomControl: false,
    attributionControl: session.mode === 'bastyon',
    scrollWheelZoom: false,
    keyboard: false,
  })
  map.value.setView(props.circle?.center ?? props.points[0]?.at ?? [55.75, 37.62], 12)
  addTiles(leaflet, map.value, session.mode === 'bastyon')
  draw()
})

watch(() => [props.points, props.selected, props.circle], draw, { deep: true })
onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <div class="pmap" :style="{ height: `${height}px` }" role="img" :aria-label="label">
    <div ref="el" class="pmap__canvas" />
    <p v-if="failed" class="pmap__failed">{{ t('location.mapFailed') }}</p>
  </div>
</template>

<style scoped>
.pmap {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-l);
  background: var(--map-land);
  isolation: isolate;
}

.pmap__canvas {
  position: absolute;
  inset: 0;
}

.pmap__failed {
  position: absolute;
  inset: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
}

:deep(.pmap-wrap) {
  background: none;
  border: 0;
}

:deep(.pmap-pin) {
  position: absolute;
  transform: translate(-50%, -50%);
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font: 700 13px / 28px var(--font-sans);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  box-shadow: var(--shadow-2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

:deep(.pmap-pin--dot) {
  width: 32px;
  height: 32px;
  padding: 0;
  justify-content: center;
  background: var(--primary);
  color: #ffffff;
}

:deep(.pmap-pin--on) {
  background: var(--contrast);
  color: var(--on-contrast);
}
</style>
