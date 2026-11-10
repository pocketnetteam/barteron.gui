import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import { useSessionStore } from './session'

export type Theme = 'light' | 'dark'
export type ThemePreference = 'system' | Theme

const STORAGE_KEY = 'barteron.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Maps the host's `theme.rootid` to our two themes.
 * - bastyon-nextgen sends `light` / `dark`;
 * - the previous host sends `''` (white), `black` (navy) or `gray`.
 * Anything that is not light is dark: the navy theme is dropped (main.html).
 */
export function themeFromHost(rootid: string | null | undefined): Theme | null {
  if (rootid === null || rootid === undefined) return null
  return rootid === '' || rootid === 'light' || rootid === 'white' ? 'light' : 'dark'
}

export function resolveTheme(
  preference: ThemePreference,
  hostTheme: Theme | null,
  systemDark: boolean
): Theme {
  if (preference !== 'system') return preference
  return hostTheme ?? (systemDark ? 'dark' : 'light')
}

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // Storage can be blocked in a third-party iframe.
  }
  return 'system'
}

function writePreference(value: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Not saved; the choice still applies until reload.
  }
}

/**
 * Theme: the user's choice (Системная / Светлая / Тёмная, settings in stage 6).
 * «Системная» follows the Bastyon host theme inside the host — like `inherit`
 * in the old app — and the OS setting outside it.
 */
export const useThemeStore = defineStore('theme', () => {
  const session = useSessionStore()
  const preference = ref<ThemePreference>(readPreference())

  const media = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
  const systemDark = ref(media?.matches ?? false)
  media?.addEventListener?.('change', (event) => {
    systemDark.value = event.matches
  })

  const hostTheme = computed(() => themeFromHost(session.hostTheme))
  const theme = computed(() => resolveTheme(preference.value, hostTheme.value, systemDark.value))

  function setPreference(value: ThemePreference): void {
    preference.value = value
    writePreference(value)
  }

  /** Keeps <html data-theme> in sync. Call once at startup. */
  function apply(root: HTMLElement = document.documentElement): void {
    watchEffect(() => {
      root.dataset.theme = theme.value
    })
  }

  return { preference, systemDark, hostTheme, theme, setPreference, apply }
})
