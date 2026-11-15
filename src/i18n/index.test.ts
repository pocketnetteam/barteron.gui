import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveLocale } from './index'

describe('resolveLocale', () => {
  it.each([
    ['ru', 'ru'],
    ['ru-RU', 'ru'],
    ['sr_RS', 'sr'],
    ['EN-us', 'en'],
    ['de', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    [null, 'en'],
  ])('%s → %s', (input, expected) => {
    expect(resolveLocale(input)).toBe(expected)
  })
})

describe('a language whose texts do not load', () => {
  afterEach(() => {
    vi.doUnmock('./locales/sr')
    vi.resetModules()
  })

  it('keeps the current language on screen, and switches once they load', async () => {
    vi.resetModules()
    let fail = true
    vi.doMock('./locales/sr', async (original) => {
      if (fail) throw new Error('Failed to fetch dynamically imported module')
      return original()
    })
    // A fresh module: the setup registered all three languages in the shared one.
    const fresh = await import('./index')
    await fresh.setLocale('ru')
    await expect(fresh.setLocale('sr')).resolves.toBeUndefined()
    expect(fresh.i18n.global.locale.value).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    expect(fresh.i18n.global.t('app.connecting')).toBe('Подключаемся к Bastyon…')

    // Asked again (the network is back): this time it loads.
    fail = false
    await fresh.setLocale('sr')
    expect(fresh.i18n.global.locale.value).toBe('sr')
    expect(document.documentElement.lang).toBe('sr')
    expect(fresh.i18n.global.t('app.connecting')).toBe('Повезујемо се са Bastyon-ом…')
  })
})
