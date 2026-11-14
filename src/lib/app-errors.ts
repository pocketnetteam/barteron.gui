import type { App } from 'vue'
import { isChunkLoadError } from '@/composables/version-conflict'
import { i18n } from '@/i18n'
import { showToast, toasts } from '@/ui/toast'

/**
 * A bug that escaped a component — in a click handler, a watcher or a
 * render — went to the console only, and the button just did nothing. Now
 * the user is told, once while the toast is up, and the console keeps the
 * details for a report. A piece of the app that did not load is left to
 * «Вышла новая версия» (App.vue, `watchVersionConflict`).
 */
export function installErrorHandler(app: App): void {
  let shown: number | null = null
  app.config.errorHandler = (error, _instance, info) => {
    console.error('[barteron] unhandled error in', info, error)
    if (isChunkLoadError(error)) return
    if (shown !== null && toasts.items.some((t) => t.id === shown)) return
    shown = showToast(i18n.global.t('app.error'), { kind: 'error' })
  }
}
