import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useSessionStore } from './session'
import { resolveTheme, themeFromHost, useThemeStore } from './theme'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('themeFromHost', () => {
  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    // The previous host: '' is white, black is navy, gray is dark.
    ['', 'light'],
    ['white', 'light'],
    ['black', 'dark'],
    ['gray', 'dark'],
    ['navy', 'dark'],
  ])('%j → %s', (rootid, theme) => {
    expect(themeFromHost(rootid)).toBe(theme)
  })

  it('is null without a host', () => {
    expect(themeFromHost(null)).toBeNull()
    expect(themeFromHost(undefined)).toBeNull()
  })
})

describe('resolveTheme', () => {
  it('an explicit choice wins over the host and the OS', () => {
    expect(resolveTheme('light', 'dark', true)).toBe('light')
    expect(resolveTheme('dark', 'light', false)).toBe('dark')
  })

  it('«system» follows the host inside Bastyon', () => {
    expect(resolveTheme('system', 'dark', false)).toBe('dark')
    expect(resolveTheme('system', 'light', true)).toBe('light')
  })

  it('«system» follows the OS outside Bastyon', () => {
    expect(resolveTheme('system', null, true)).toBe('dark')
    expect(resolveTheme('system', null, false)).toBe('light')
  })
})

describe('theme store', () => {
  it('starts with «system» and follows the host theme', () => {
    const theme = useThemeStore()
    expect(theme.preference).toBe('system')
    useSessionStore().hostTheme = 'black'
    expect(theme.theme).toBe('dark')
  })

  it('saves the choice and reads it back', () => {
    useThemeStore().setPreference('dark')
    expect(localStorage.getItem('barteron.theme')).toBe('dark')

    setActivePinia(createPinia())
    expect(useThemeStore().preference).toBe('dark')
  })

  it('ignores a broken saved value', () => {
    localStorage.setItem('barteron.theme', 'navy')
    expect(useThemeStore().preference).toBe('system')
  })

  it('sets data-theme on the root element', async () => {
    const root = document.createElement('div')
    const theme = useThemeStore()
    theme.apply(root)
    theme.setPreference('dark')
    await nextTick()
    expect(root.dataset.theme).toBe('dark')
    theme.setPreference('light')
    await nextTick()
    expect(root.dataset.theme).toBe('light')
  })
})
