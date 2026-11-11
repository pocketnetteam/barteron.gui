import type { Router } from 'vue-router'
import { useUiStore } from '@/stores/ui'

/**
 * A lazy piece of the app did not load. After a deploy the old files are gone
 * from barteron.club, and an app opened before it asks for chunks that no
 * longer exist; the old app showed «Версия Barteron изменилась!» on a webpack
 * `ChunkLoadError` (main.js `showVersionConflictIfNeeded`). Browsers word it
 * differently: Chrome «Failed to fetch dynamically imported module», Firefox
 * «error loading dynamically imported module», Safari «Importing a module
 * script failed».
 */
export function isChunkLoadError(error: unknown): boolean {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|ChunkLoadError|Unable to preload CSS/i.test(
    text
  )
}

/** Shows «Вышла новая версия Barteron» when a route's or a component's chunk fails. */
export function watchVersionConflict(router: Router): () => void {
  const ui = useUiStore()
  const onPreload = () => {
    ui.versionConflict = true
  }
  // Vite sends this for every failed `import()` in a build, components included.
  window.addEventListener('vite:preloadError', onPreload)
  const stop = router.onError((error) => {
    if (isChunkLoadError(error)) ui.versionConflict = true
  })
  return () => {
    window.removeEventListener('vite:preloadError', onPreload)
    stop()
  }
}
