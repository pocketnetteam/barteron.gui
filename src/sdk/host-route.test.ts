import { describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { followHostRoutes, routeFromHost } from './host-route'

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

  it('anyone can write the route into a Bastyon link: it stays a path of the app', () => {
    for (const route of [
      '//evil.example',
      '\\\\evil.example',
      '/\\evil.example',
      ' \\/evil.example',
    ]) {
      expect(routeFromHost({ route })).toBe('/evil.example')
    }
    expect(routeFromHost({ route: 'https://evil.example/x' })).toBe('/https://evil.example/x')
    expect(routeFromHost({ route: 'javascript:alert(1)' })).toBe('/javascript:alert(1)')
  })
})

describe('followHostRoutes', () => {
  function setup() {
    let listener: ((data: unknown) => void) | null = null
    const sdk = {
      on: (key: string, fn: (data: unknown) => void) => {
        if (key === 'changestate') listener = fn
      },
    }
    // The app's scheme in small: its pages load slowly in a test.
    const page = { render: () => null }
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: page },
        { path: '/barter/:id', name: 'barterItem', component: page },
        { path: '/:pathMatch(.*)*', name: 'unknown', component: page },
      ],
    })
    followHostRoutes(sdk as Parameters<typeof followHostRoutes>[0], router)
    const send = async (data: unknown) => {
      listener!(data)
      await new Promise((r) => setTimeout(r, 0))
      await router.isReady()
    }
    return { router, send }
  }

  it('opens the page the host names; the same page is not pushed again', async () => {
    const { router, send } = setup()
    await router.push('/')
    await send({ route: 'barter/abc' })
    expect(router.currentRoute.value.fullPath).toBe('/barter/abc')
    // The router itself refuses a duplicate: the app must not even ask it to.
    const push = vi.spyOn(router, 'push')
    await send({ route: 'barter/abc' })
    expect(push).not.toHaveBeenCalled()
    await send({ route: '/' })
    expect(push).toHaveBeenCalledWith('/')
  })

  it('a link made to lead away keeps the app on its own origin, on «not found»', async () => {
    const { router, send } = setup()
    const origin = window.location.origin
    for (const route of ['//evil.example/x', '\\\\evil.example', 'https://evil.example']) {
      await send({ route })
      expect(window.location.origin).toBe(origin)
      expect(router.currentRoute.value.name).toBe('unknown')
    }
  })
})
