import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { PHONE_QUERY, useMedia, usePhone } from './media'

/** A media query list with the current API, or only the old one (Safari before 14). */
function fakeQuery(matches: boolean, old = false) {
  const listeners = new Set<(event: { matches: boolean }) => void>()
  const add = (listener: (event: { matches: boolean }) => void) => listeners.add(listener)
  const remove = (listener: (event: { matches: boolean }) => void) => listeners.delete(listener)
  const list = old
    ? { matches, addListener: add, removeListener: remove }
    : {
        matches,
        addEventListener: (_: string, l: (event: { matches: boolean }) => void) => add(l),
        removeEventListener: (_: string, l: (event: { matches: boolean }) => void) => remove(l),
        addListener: () => {
          throw new Error('old API used')
        },
      }
  const change = (value: boolean) => listeners.forEach((l) => l({ matches: value }))
  return { list, listeners, change }
}

afterEach(() => vi.unstubAllGlobals())

describe('media queries', () => {
  it.each([false, true])('follows the query while in use (old API: %s)', (old) => {
    const query = fakeQuery(false, old)
    const matchMedia = vi.fn(() => query.list)
    vi.stubGlobal('matchMedia', matchMedia)
    const scope = effectScope()
    const phone = scope.run(() => usePhone())!
    expect(matchMedia).toHaveBeenCalledWith(PHONE_QUERY)
    expect(phone.value).toBe(false)
    query.change(true)
    expect(phone.value).toBe(true)
    scope.stop()
    expect(query.listeners.size).toBe(0)
    query.change(false)
    expect(phone.value).toBe(true)
  })

  it('starts from what matches now', () => {
    vi.stubGlobal('matchMedia', () => fakeQuery(true).list)
    const scope = effectScope()
    expect(scope.run(() => useMedia('(min-width: 1px)'))!.value).toBe(true)
    scope.stop()
  })

  it('no matchMedia at all: never matches', () => {
    vi.stubGlobal('matchMedia', undefined)
    const scope = effectScope()
    expect(scope.run(() => usePhone())!.value).toBe(false)
    scope.stop()
  })
})
