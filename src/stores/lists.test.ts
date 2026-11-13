import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { i18n, setLocale } from '@/i18n'
import { useCatalogPrefsStore } from './catalog-prefs'
import { useFavoritesStore } from './favorites'
import { useLocaleStore } from './locale'
import { useSearchHistoryStore } from './search-history'
import { useSessionStore } from './session'
import { useViewedStore, VIEWED_MAX } from './viewed'

const ME = 'PMockUser1111111111111111111111111'

describe('lists kept under the old app’s keys', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    setLocale('ru')
  })

  it('favourites: old `<address>_like`, toggle, forget unknown ids', async () => {
    localStorage.setItem(`${ME}_like`, JSON.stringify(['a', 'b', 42, 'a']))
    const session = useSessionStore()
    const favorites = useFavoritesStore()
    expect(favorites.ids).toEqual([])
    session.address = ME
    await nextTick()
    expect(favorites.ids).toEqual(['a', 'b'])
    favorites.toggle('c')
    favorites.toggle('a')
    expect(JSON.parse(localStorage.getItem(`${ME}_like`)!)).toEqual(['b', 'c'])
    expect(favorites.has('c')).toBe(true)
    favorites.keepOnly(['c'])
    expect(favorites.ids).toEqual(['c'])
  })

  it('viewed: newest first, no repeats, at most 20, drafts skipped', async () => {
    const session = useSessionStore()
    session.address = ME
    const viewed = useViewedStore()
    for (let i = 0; i < 25; i++) viewed.add(`id${i}`)
    viewed.add('id20')
    viewed.add('draft')
    expect(viewed.ids.length).toBe(VIEWED_MAX)
    expect(viewed.ids.slice(0, 2)).toEqual(['id20', 'id24'])
    expect(JSON.parse(localStorage.getItem(`${ME}_viewed`)!)[0]).toBe('id20')
  })

  it('sort and view: old `<address>_offer` shape', async () => {
    localStorage.setItem(
      `${ME}_offer`,
      JSON.stringify({ bartersView: 'row', order: { orderBy: 'price', orderDesc: false } })
    )
    const session = useSessionStore()
    session.address = ME
    await nextTick()
    const prefs = useCatalogPrefsStore()
    expect(prefs.view).toBe('row')
    expect(prefs.sort).toBe('price_asc')
    prefs.setSort('height_desc')
    expect(JSON.parse(localStorage.getItem(`${ME}_offer`)!)).toEqual({
      bartersView: 'row',
      order: { orderBy: 'height', orderDesc: true },
    })
  })

  it.each([
    ['not JSON', '{oops'],
    ['a number', '42'],
    ['unknown values', JSON.stringify({ bartersView: 'grid', order: { orderBy: 'rating' } })],
    ['no order', JSON.stringify({ bartersView: 'row' })],
  ])('catalog view and sort: %s from storage gives the defaults', async (_, raw) => {
    localStorage.setItem(`${ME}_offer`, raw)
    useSessionStore().address = ME
    await nextTick()
    const prefs = useCatalogPrefsStore()
    expect(prefs.sort).toBe('height_desc')
    expect(prefs.view).toBe(raw.includes('row') ? 'row' : 'tile')
  })

  it('search history: newest first, case-insensitive repeats, clear', () => {
    const history = useSearchHistoryStore()
    history.add('Велосипед')
    history.add('гитара')
    history.add('велосипед ')
    expect(history.items).toEqual(['велосипед', 'гитара'])
    history.remove('гитара')
    expect(history.items).toEqual(['велосипед'])
    history.clear()
    expect(history.items).toEqual([])
  })

  it('language: Bastyon’s unless chosen; old `<address>_locale` values', async () => {
    const session = useSessionStore()
    session.hostLocale = 'en-US'
    const locale = useLocaleStore()
    await nextTick()
    expect(i18n.global.locale.value).toBe('en')
    locale.set('sr-RS')
    await nextTick()
    expect(i18n.global.locale.value).toBe('sr')
    expect(localStorage.getItem('locale')).toBe('"sr-RS"')
    locale.set('inherit')
    await nextTick()
    expect(i18n.global.locale.value).toBe('en')
  })
})
