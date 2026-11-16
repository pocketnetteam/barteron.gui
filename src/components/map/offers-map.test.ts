import { mount } from '@vue/test-utils'
import * as Leaflet from 'leaflet'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { emptyOffer, type Offer } from '@/models/offer'
import OffersMap from './OffersMap.vue'
import { loadLeaflet } from './leaflet'

const L = ((Leaflet as unknown as { default?: typeof Leaflet }).default ??
  Leaflet) as typeof Leaflet

/** Three offers of one seller at the very same point. */
const samePoint: Offer[] = ['a', 'b', 'c'].map((c, i) => ({
  ...emptyOffer('PSeller', 'ru-RU', 1_700_000_000_000),
  hash: c.repeat(64),
  caption: `Вещь ${i + 1}`,
  priceCents: (i + 1) * 1000,
  geohash: 'ucftpuzx7c5z',
}))

function mountMap(props: { offers?: Offer[]; zoom?: number } = {}) {
  // happy-dom lays nothing out: a map of 0×0 cannot fit its circle.
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  const pinia = createPinia()
  setActivePinia(pinia)
  void setLocale('ru')
  return mount(OffersMap, {
    attachTo: document.body,
    props: { offers: [], center: [55.75, 37.62], radiusKm: 10, ...props },
    global: { plugins: [pinia, i18n] },
  })
}

afterEach(() => vi.restoreAllMocks())

describe('the catalog map leaving the page', () => {
  it('removes the Leaflet map: its listeners on the window go with it', async () => {
    await loadLeaflet()
    const removed = vi.spyOn(L.Map.prototype, 'remove')
    const off = vi.spyOn(window, 'removeEventListener')
    const wrapper = mountMap()
    await vi.waitFor(() => expect(wrapper.find('.leaflet-container').exists()).toBe(true))
    wrapper.unmount()
    expect(removed).toHaveBeenCalledTimes(1)
    expect(off.mock.calls.some(([type]) => type === 'resize')).toBe(true)
  })

  it('left before Leaflet loaded: no map is made on the page that is gone', async () => {
    // `initialize` is Leaflet's constructor body; the types do not list it.
    const proto = L.Map.prototype as unknown as { initialize: () => void }
    const made = vi.spyOn(proto, 'initialize')
    const wrapper = mountMap()
    wrapper.unmount()
    await loadLeaflet()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(made).not.toHaveBeenCalled()
  })
})

describe('offers at one point on the catalog map', () => {
  it('zoomed out: one «+3» pill, its title in the right plural', async () => {
    const wrapper = mountMap({ offers: samePoint, zoom: 12 })
    await vi.waitFor(() => expect(wrapper.findAll('.omap-pin')).toHaveLength(1))
    expect(wrapper.find('.omap-pin--group').text()).toBe('+3')
    expect(wrapper.find('.leaflet-marker-icon').attributes('title')).toBe('3 объявления рядом')
    wrapper.unmount()
  })

  it('at the last zoom: each its own pill, apart, and a press picks that offer', async () => {
    const wrapper = mountMap({ offers: samePoint, zoom: 17 })
    await vi.waitFor(() => expect(wrapper.findAll('.omap-pin')).toHaveLength(3))
    expect(wrapper.find('.omap-pin--group').exists()).toBe(false)
    const icons = wrapper.findAll('.leaflet-marker-icon')
    const spots = icons.map(({ element }) => {
      const { left, top, transform } = (element as HTMLElement).style
      return `${left} ${top} ${transform}`
    })
    expect(new Set(spots).size).toBe(3)
    await icons[1]!.trigger('click')
    expect(wrapper.emitted('select')?.at(-1)).toEqual(['b'.repeat(64)])
    wrapper.unmount()
  })
})
