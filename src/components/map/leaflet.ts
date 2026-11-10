/**
 * Leaflet loads in its own chunk, only when a map is shown. Tiles are
 * OpenStreetMap, as in the old app; under Tor they go through the host tunnel
 * (`fetch_hosts` in the manifest). The SDK mock stays offline: no tiles.
 */

import type * as Leaflet from 'leaflet'

export type L = typeof Leaflet

let loading: Promise<L> | null = null

export function loadLeaflet(): Promise<L> {
  loading ??= Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
    .then(([module]) => ((module as unknown as { default?: L }).default ?? module) as L)
    .catch((error) => {
      loading = null
      throw error
    })
  return loading
}

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'

/** Tiles only in a real host: the mock (plain browser, e2e) makes no outside requests. */
export function addTiles(leaflet: L, map: Leaflet.Map, online: boolean): void {
  if (!online) return
  leaflet
    .tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION, crossOrigin: true })
    .addTo(map)
}
