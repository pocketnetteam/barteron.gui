import { describe, expect, it } from 'vitest'
import { routeFromHost } from './host-route'

describe('routeFromHost', () => {
  it('follows the previous host: `{route}` without the leading slash', () => {
    expect(routeFromHost({ route: 'barter/abc' })).toBe('/barter/abc')
    expect(routeFromHost({ route: '/profile/P1#ads' })).toBe('/profile/P1#ads')
    expect(routeFromHost({ route: '' })).toBe('/')
  })

  it('ignores bastyon-nextgen’s own address and anything else', () => {
    expect(routeFromHost({ path: '/app/barteron.pocketnet.app/barter/abc' })).toBeNull()
    expect(routeFromHost(null)).toBeNull()
    expect(routeFromHost('barter/abc')).toBeNull()
    expect(routeFromHost({ route: 42 })).toBeNull()
  })
})
