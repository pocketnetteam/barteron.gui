<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { decodeGeohash, type LatLng } from '@/lib/geohash'
import { formatPkoin } from '@/lib/format'
import { escapeHtml } from '@/lib/text'
import { isForNothing, offerPkoin, type Offer } from '@/models/offer'
import type { Rates } from '@/api/rates'
import { useSessionStore } from '@/stores/session'
import { addTiles, loadLeaflet, type L } from './leaflet'

/**
 * Offers on a map (s2-map): price pills, close ones joined into «+N», the
 * search circle in the middle of the map. Dragging the map moves the circle;
 * the page decides when to search there.
 */
const props = defineProps<{
  offers: readonly Offer[]
  center: LatLng
  radiusKm: number
  zoom?: number
  selected?: string | null
  rates?: Rates | null
}>()
const emit = defineEmits<{
  move: [center: LatLng, zoom: number]
  select: [id: string | null]
}>()
defineExpose({ zoomIn: () => map.value?.zoomIn(), zoomOut: () => map.value?.zoomOut(), flyTo })

const { t, locale } = useI18n()
const session = useSessionStore()
const el = ref<HTMLElement>()
const failed = ref(false)
const map = shallowRef<Leaflet.Map>()
let leaflet: L | null = null
let circle: Leaflet.Circle | null = null
let layer: Leaflet.LayerGroup | null = null
let applied: LatLng = props.center

interface Point {
  offer: Offer
  at: LatLng
}

const points = computed<Point[]>(() =>
  props.offers.flatMap((offer) => {
    const at = decodeGeohash(offer.geohash)
    return at && offer.hash ? [{ offer, at }] : []
  })
)

function label(offer: Offer): string {
  if (isForNothing(offer)) return t('map.free')
  const pkoin = offerPkoin(offer, props.rates)
  return pkoin === null ? '—' : formatPkoin(pkoin, locale.value)
}

/** Joins pills closer than this many pixels. */
const CLUSTER_PX = 46

function draw() {
  const m = map.value
  if (!m || !leaflet || !layer) return
  layer.clearLayers()
  const groups: { center: Leaflet.Point; items: Point[] }[] = []
  for (const p of points.value) {
    const px = m.latLngToLayerPoint(p.at)
    const near = groups.find((g) => g.center.distanceTo(px) < CLUSTER_PX)
    if (near) near.items.push(p)
    else groups.push({ center: px, items: [p] })
  }
  for (const g of groups) {
    const first = g.items[0]!
    if (g.items.length === 1) {
      const id = first.offer.hash!
      const on = id === props.selected
      const marker = leaflet.marker(first.at, {
        icon: leaflet.divIcon({
          className: 'omap-pin-wrap',
          html: `<span class="omap-pin${on ? ' omap-pin--on' : ''}">${escapeHtml(label(first.offer))}</span>`,
          iconSize: [0, 0],
        }),
        keyboard: true,
        title: first.offer.caption,
        zIndexOffset: on ? 1000 : 0,
      })
      marker.on('click', () => emit('select', id))
      layer.addLayer(marker)
    } else {
      const bounds = leaflet.latLngBounds(g.items.map((i) => i.at))
      const marker = leaflet.marker(bounds.getCenter(), {
        icon: leaflet.divIcon({
          className: 'omap-pin-wrap',
          html: `<span class="omap-pin omap-pin--group">+${g.items.length}</span>`,
          iconSize: [0, 0],
        }),
        keyboard: true,
        title: t('map.group', { n: g.items.length }),
      })
      marker.on('click', () => m.fitBounds(bounds.pad(0.4), { maxZoom: 17 }))
      layer.addLayer(marker)
    }
  }
}

function flyTo(center: LatLng) {
  map.value?.setView(center, map.value.getZoom())
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
  })
  m.setView(props.center, props.zoom ?? 12)
  addTiles(leaflet, m, session.mode === 'bastyon')
  const primary = getComputedStyle(el.value).getPropertyValue('--primary').trim() || '#5b3cf0'
  circle = leaflet
    .circle(props.center, {
      radius: props.radiusKm * 1000,
      color: primary,
      weight: 2,
      fillColor: primary,
      fillOpacity: 0.08,
      interactive: false,
    })
    .addTo(m)
  layer = leaflet.layerGroup().addTo(m)
  m.on('move', () => circle?.setLatLng(m.getCenter()))
  m.on('moveend', () => {
    const c = m.getCenter()
    applied = [c.lat, c.lng]
    emit('move', applied, m.getZoom())
  })
  m.on('zoomend', draw)
  m.on('click', () => emit('select', null))
  map.value = m
  if (props.zoom === undefined) m.fitBounds(circle.getBounds(), { padding: [24, 24] })
  draw()
  emit('move', [m.getCenter().lat, m.getCenter().lng], m.getZoom())
})

watch(
  () => props.center,
  (center) => {
    if (!map.value || (center[0] === applied[0] && center[1] === applied[1])) return
    applied = center
    map.value.setView(center, map.value.getZoom())
  }
)
watch(
  () => props.radiusKm,
  (radius) => {
    circle?.setRadius(radius * 1000)
    if (circle && map.value) map.value.fitBounds(circle.getBounds(), { padding: [24, 24] })
  }
)
watch([points, () => props.selected, () => props.rates, locale], draw)

/** Where the chosen offer's card goes: just above its pill. */
const cardAt = ref<{ x: number; y: number } | null>(null)
function placeCard() {
  const m = map.value
  const p = points.value.find((x) => x.offer.hash === props.selected)
  if (!m || !p) {
    cardAt.value = null
    return
  }
  const pt = m.latLngToContainerPoint(p.at)
  cardAt.value = { x: pt.x, y: pt.y }
}
watch([() => props.selected, points, map], placeCard)
watch(map, (m) => m?.on('move zoom', placeCard))

onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <div class="omap">
    <div ref="el" class="omap__canvas" :aria-label="t('map.label')" />
    <div
      v-if="cardAt && $slots.card"
      class="omap__card"
      :style="{ left: `${cardAt.x}px`, top: `${cardAt.y}px` }"
    >
      <slot name="card" />
    </div>
    <p v-if="failed" class="omap__failed">{{ t('location.mapFailed') }}</p>
  </div>
</template>

<style scoped>
.omap {
  position: relative;
  overflow: hidden;
  background: var(--map-land);
  isolation: isolate;
}

.omap__canvas {
  position: absolute;
  inset: 0;
}

.omap__card {
  position: absolute;
  z-index: 700;
  transform: translate(-50%, calc(-100% - 40px));
  pointer-events: auto;
}

.omap__failed {
  position: absolute;
  inset: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
}

:deep(.omap-pin-wrap) {
  background: none;
  border: 0;
}

:deep(.omap-pin) {
  position: absolute;
  transform: translate(-50%, -100%);
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text);
  font: 700 13px / 30px var(--font-sans);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  box-shadow: var(--shadow-2);
  cursor: pointer;
}

:deep(.omap-pin--on) {
  background: var(--contrast);
  color: var(--on-contrast);
}

:deep(.omap-pin--group) {
  background: var(--surface);
  color: var(--link);
}

:deep(.leaflet-marker-icon:focus-visible .omap-pin) {
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
