<script setup lang="ts">
import type * as Leaflet from 'leaflet'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { addTiles, loadLeaflet, type L } from '@/components/map/leaflet'
import type { LatLng } from '@/lib/geohash'
import type { NearbyDistrict } from '@/models/nearby'
import { useSessionStore } from '@/stores/session'

/**
 * Districts of «Что продают рядом» on a map: a dot per district with its
 * number of offers, bigger where there are more, inside the search circle.
 * A dot selects its district; the map only looks, the place is changed in
 * «Где искать».
 */
const props = defineProps<{
  center: LatLng
  radiusKm: number
  districts: readonly NearbyDistrict[]
  selected: string | null
}>()
const emit = defineEmits<{ select: [cell: string | null] }>()

const { t } = useI18n()
const session = useSessionStore()
const el = ref<HTMLElement>()
const failed = ref(false)
const map = shallowRef<Leaflet.Map>()
let leaflet: L | null = null
let circle: Leaflet.Circle | null = null
let layer: Leaflet.LayerGroup | null = null

/** Dot size: 28 px for one offer, up to 48 px — neighbouring districts barely overlap. */
const size = (count: number) => Math.round(Math.min(48, 28 + Math.log2(count) * 4))

interface Dot {
  px: Leaflet.Point
  items: NearbyDistrict[]
  count: number
}

/**
 * Districts whose dots would overlap at this zoom become one dot with their
 * sum (like «+N» on the catalog map); it zooms in when pressed.
 */
function dots(m: Leaflet.Map): Dot[] {
  const result: Dot[] = []
  for (const d of [...props.districts].sort((a, b) => b.count - a.count)) {
    const px = m.latLngToLayerPoint(d.at)
    const near = result.find(
      (g) => g.px.distanceTo(px) < ((size(g.count) + size(d.count)) / 2) * 0.9
    )
    if (near) {
      near.items.push(d)
      near.count += d.count
    } else result.push({ px, items: [d], count: d.count })
  }
  return result
}

function draw() {
  const m = map.value
  if (!m || !leaflet || !layer) return
  const L = leaflet
  layer.clearLayers()
  // Small ones on top, so a big dot does not hide its neighbours.
  for (const dot of dots(m).sort((a, b) => b.count - a.count)) {
    const on = dot.items.some((d) => d.cell === props.selected)
    const one = dot.items.length === 1 ? dot.items[0]! : null
    const s = size(dot.count)
    const at: LatLng = one
      ? one.at
      : [
          dot.items.reduce((sum, d) => sum + d.at[0] * d.count, 0) / dot.count,
          dot.items.reduce((sum, d) => sum + d.at[1] * d.count, 0) / dot.count,
        ]
    const marker = L.marker(at, {
      icon: L.divIcon({
        className: 'nmap-dot-wrap',
        html: `<span class="nmap-dot${on ? ' nmap-dot--on' : ''}${one ? '' : ' nmap-dot--group'}" style="width:${s}px;height:${s}px">${dot.count}</span>`,
        iconSize: [0, 0],
      }),
      keyboard: true,
      title: one
        ? t('nearby.mapDot', { n: dot.count }, dot.count)
        : t('nearby.mapGroup', { n: dot.items.length }, dot.items.length),
      zIndexOffset: on ? 1000 : 0,
    })
    marker.on('click', () => {
      if (one) emit('select', on ? null : one.cell)
      else if (m.getZoom() < m.getMaxZoom())
        m.fitBounds(L.latLngBounds(dot.items.map((d) => d.at)).pad(0.6), { maxZoom: 15 })
      else emit('select', dot.items[0]!.cell)
    })
    layer.addLayer(marker)
  }
}

/** The circle and every district: the area is a square, its corners stick out of the circle. */
function fit() {
  if (!map.value || !circle) return
  const bounds = circle.getBounds()
  for (const d of props.districts) bounds.extend(d.at)
  map.value.fitBounds(bounds, { padding: [28, 28] })
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
    zoomControl: true,
    attributionControl: session.mode === 'bastyon',
    scrollWheelZoom: false,
    // Fits the circle snugly instead of a whole zoom step smaller.
    zoomSnap: 0.25,
  })
  m.setView(props.center, 11)
  addTiles(leaflet, m, session.mode === 'bastyon')
  const primary = getComputedStyle(el.value).getPropertyValue('--primary').trim() || '#5b3cf0'
  circle = leaflet
    .circle(props.center, {
      radius: props.radiusKm * 1000,
      color: primary,
      weight: 2,
      fillColor: primary,
      fillOpacity: 0.06,
      interactive: false,
    })
    .addTo(m)
  layer = leaflet.layerGroup().addTo(m)
  m.on('click', () => emit('select', null))
  m.on('zoomend', draw)
  map.value = m
  fit()
  draw()
})

watch(
  () => [props.center, props.radiusKm] as const,
  ([center, radius]) => {
    circle?.setLatLng(center).setRadius(radius * 1000)
    fit()
  }
)
watch(() => props.districts, fit)
watch([() => props.districts, () => props.selected], draw)

onBeforeUnmount(() => map.value?.remove())
</script>

<template>
  <div class="nmap" data-testid="nearby-map">
    <div ref="el" class="nmap__canvas" :aria-label="t('nearby.mapLabel')" />
    <p v-if="failed" class="nmap__failed">{{ t('location.mapFailed') }}</p>
  </div>
</template>

<style scoped>
.nmap {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-l);
  background: var(--map-land);
  isolation: isolate;
}

.nmap__canvas {
  position: absolute;
  inset: 0;
}

.nmap__failed {
  position: absolute;
  inset: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text3);
}

:deep(.nmap-dot-wrap) {
  background: none;
  border: 0;
}

:deep(.nmap-dot) {
  position: absolute;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  border: 2px solid var(--surface);
  border-radius: 50%;
  background: var(--primary);
  color: var(--on-primary, #fff);
  font: 700 13px / 1 var(--font-sans);
  font-variant-numeric: tabular-nums;
  box-shadow: var(--shadow-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Several districts in one dot: a ring says «there is more inside». */
:deep(.nmap-dot--group) {
  box-shadow:
    0 0 0 4px var(--ring),
    var(--shadow-2);
}

:deep(.nmap-dot--on) {
  background: var(--contrast);
  color: var(--on-contrast);
  box-shadow:
    0 0 0 3px var(--primary),
    var(--shadow-2);
}

:deep(.leaflet-marker-icon:focus-visible .nmap-dot) {
  box-shadow: 0 0 0 3px var(--ring);
}

:deep(.leaflet-control-zoom) {
  border: 0;
  box-shadow: var(--shadow-2);
}
</style>
