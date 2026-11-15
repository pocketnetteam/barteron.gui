import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, type RouteLocationNormalized } from 'vue-router'
import { createAppRouter } from './index'

// A real push loads the lazy page with all its imports, which takes seconds under a full run.
vi.mock('@/views/HomeView.vue', () => ({ default: { render: () => null } }))

const router = createAppRouter(createMemoryHistory())
const HASH = 'a'.repeat(64)

/** Links to the old app are already shared in chats, so every one must still resolve. */
describe('routes kept from the old app', () => {
  it.each([
    ['/', 'home', {}],
    ['/category/12', 'category', { id: '12' }],
    ['/barter/create', 'createBarter', {}],
    [`/barter/create/${HASH}`, 'createBarter', { id: HASH }],
    [`/barter/edit/${HASH}`, 'createBarter', { id: HASH }],
    [`/barter/exchange/${HASH}`, 'exchangeOptions', { id: HASH }],
    ['/barter/search', 'ThreeSidedSearch', {}],
    ['/barter/safedeal', 'SafeDeal', {}],
    ['/barter/moderation', 'VotingModeration', {}],
    [`/barter/${HASH}`, 'barterItem', { id: HASH }],
    [
      '/profile/PMockUser1111111111111111111111111',
      'profile',
      {
        id: 'PMockUser1111111111111111111111111',
      },
    ],
    ['/about', 'about', {}],
    ['/404', 'notFound', {}],
  ])('%s → %s', (path, name, params) => {
    const route = router.resolve(path)
    expect(route.name).toBe(name)
    expect(route.params).toEqual(params)
  })

  it('keeps query parameters of shared deal links', () => {
    const route = router.resolve('/barter/safedeal?deal=abc&validator=P1')
    expect(route.name).toBe('SafeDeal')
    expect(route.query).toEqual({ deal: 'abc', validator: 'P1' })
  })

  it('shows "not found" for unknown paths', () => {
    expect(router.resolve('/no/such/page').name).toBe('unknown')
  })
})

describe('start page', () => {
  it('sends /index.html (the start_url bastyon-nextgen opens) home, keeping the query', async () => {
    const local = createAppRouter(createMemoryHistory())
    await local.push('/index.html?ref=abc')
    expect(local.currentRoute.value.name).toBe('home')
    expect(local.currentRoute.value.query).toEqual({ ref: 'abc' })
  })
})

describe('scroll on navigation', () => {
  const scroll = router.options.scrollBehavior!
  // The resolved route is what the router hands `scrollBehavior`.
  const at = (path: string) => router.resolve(path) as RouteLocationNormalized

  it('a new page starts at the top', () => {
    expect(scroll(at('/barter/' + HASH), at('/category/12'), null)).toEqual({ top: 0 })
  })

  it('«назад» returns to where the page was', () => {
    const saved = { left: 0, top: 640 }
    expect(scroll(at('/category/12'), at('/barter/' + HASH), saved)).toBe(saved)
  })

  it('filters and sorting on the same page keep the scroll', () => {
    expect(scroll(at('/category/12?price=1-5'), at('/category/12'), null)).toBe(false)
  })
})
