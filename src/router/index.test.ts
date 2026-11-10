import { describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from './index'

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
