// Tests switch languages synchronously: all three are registered up front.
import { config, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, vi } from 'vitest'
import { registerLocale } from '@/i18n'
import { removeStored, storedKeys } from '@/lib/storage'
import { dismissAll } from '@/ui/toast'
import en from '@/i18n/locales/en'
import ru from '@/i18n/locales/ru'
import sr from '@/i18n/locales/sr'

registerLocale('ru', ru)
registerLocale('en', en)
registerLocale('sr', sr)

/*
 * Nothing one test leaves behind reaches the next. Globals and env stubs come
 * back by `unstubGlobals`/`unstubEnvs` (vite.config.ts), spies by
 * `restoreMocks`; the rest is here.
 */

// A component a test mounted and left: its watchers and queries would go on
// running into the next test. Unmounted unless the test did it.
const mounted = new Set<VueWrapper>()
config.plugins.VueWrapper.install((wrapper) => {
  mounted.add(wrapper as VueWrapper)
  return {}
})

beforeEach(() => {
  // What the device refused lives in memory (`lib/storage.ts`) until reload:
  // a page reload for the next test.
  for (const key of storedKeys('')) removeStored(key)
  // Not in the node environment (build, service worker).
  if (typeof localStorage !== 'undefined') localStorage.clear()
  // Nothing leaves the machine: p2p.back, Nominatim, rates. A test that wants
  // an answer stubs `fetch` itself.
  vi.stubGlobal('fetch', () => Promise.reject(new Error('no network in tests')))
})

afterEach(() => {
  for (const wrapper of mounted) {
    if (!wrapper.vm.$.isUnmounted) wrapper.unmount()
  }
  mounted.clear()
  vi.useRealTimers()
  // Toasts are one list for the app: at most three, the oldest goes first.
  dismissAll()
})
