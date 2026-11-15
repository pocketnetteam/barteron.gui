import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { searchAddress, type FoundPlace } from '@/api/geo'
import { i18n } from '@/i18n'
import { useSessionStore } from '@/stores/session'
import { useAddressSearch } from './address-search'

vi.mock('@/api/geo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/geo')>()),
  searchAddress: vi.fn(),
}))

const MOSCOW: FoundPlace = {
  point: [55.75, 37.61],
  label: 'Москва, Россия',
  raw: { lat: '55.75', lon: '37.61' },
}

function setup(mode: 'bastyon' | 'mock' = 'bastyon') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useSessionStore().mode = mode
  let search!: ReturnType<typeof useAddressSearch>
  const wrapper = mount(
    defineComponent({
      setup() {
        search = useAddressSearch()
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, i18n] } }
  )
  return { search, wrapper }
}

/** Answers kept until the test settles them. */
function answers() {
  const pending: { resolve: (v: FoundPlace[]) => void; reject: (e: unknown) => void }[] = []
  vi.mocked(searchAddress).mockImplementation(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject }))
  )
  return pending
}

afterEach(() => {
  vi.useRealTimers()
  vi.mocked(searchAddress).mockReset()
})

describe('address search: what the note under the field says', () => {
  it('while typing and waiting it is «ищем», not «ничего не нашлось»', async () => {
    vi.useFakeTimers()
    const pending = answers()
    const { search, wrapper } = setup()
    search.query.value = 'Моск'
    await nextTick()
    // The pause before asking: nothing has been looked for yet.
    expect(search.note.value).toBe('searching')
    await vi.advanceTimersByTimeAsync(700)
    expect(search.note.value).toBe('searching')
    pending[0]!.resolve([])
    await flushPromises()
    expect(search.note.value).toBe('empty')
    // Typing on: the empty answer was for the old text.
    search.query.value = 'Москв'
    await nextTick()
    expect(search.note.value).toBe('searching')
    await vi.advanceTimersByTimeAsync(700)
    pending[1]!.resolve([MOSCOW])
    await flushPromises()
    expect(search.results.value).toEqual([MOSCOW])
    expect(search.note.value).toBeNull()
    wrapper.unmount()
  })

  it('the service not answering is «не удалось», not «ничего не нашлось»', async () => {
    vi.useFakeTimers()
    const pending = answers()
    const { search, wrapper } = setup()
    search.query.value = 'Белград'
    await vi.advanceTimersByTimeAsync(700)
    pending[0]!.reject(new Error('nominatim_429'))
    await flushPromises()
    expect(search.note.value).toBe('failed')
    expect(search.searching.value).toBe(false)
    wrapper.unmount()
  })

  it('outside Bastyon it says the search works there; a short text says nothing', async () => {
    vi.useFakeTimers()
    const { search, wrapper } = setup('mock')
    search.query.value = 'Мо'
    await nextTick()
    expect(search.note.value).toBeNull()
    search.query.value = 'Моск'
    await nextTick()
    expect(search.note.value).toBe('offline')
    // Past the pause after typing: Nominatim is not asked outside Bastyon.
    await vi.advanceTimersByTimeAsync(2000)
    expect(searchAddress).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('an answer for text since changed does not count for the new one', async () => {
    vi.useFakeTimers()
    const pending = answers()
    const { search, wrapper } = setup()
    search.query.value = 'Моск'
    await vi.advanceTimersByTimeAsync(700)
    search.query.value = 'Москва'
    await nextTick()
    await vi.advanceTimersByTimeAsync(700)
    // The old request was dropped; even if it answers, the new text is still being looked for.
    pending[0]!.resolve([MOSCOW])
    await flushPromises()
    expect(search.results.value).toEqual([])
    expect(search.note.value).toBe('searching')
    expect(search.searching.value).toBe(true)
    wrapper.unmount()
  })

  it('back to a text found before: «ищем» until it is looked up again, not «ничего»', async () => {
    vi.useFakeTimers()
    const pending = answers()
    const { search, wrapper } = setup()
    search.query.value = 'Моск'
    await vi.advanceTimersByTimeAsync(700)
    pending[0]!.resolve([MOSCOW])
    await flushPromises()
    search.query.value = 'Москж'
    await nextTick()
    search.query.value = 'Моск'
    await nextTick()
    expect(search.results.value).toEqual([])
    expect(search.note.value).toBe('searching')
    wrapper.unmount()
  })
})
