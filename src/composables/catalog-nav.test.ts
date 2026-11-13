import { describe, expect, it } from 'vitest'
import { ALL_CATEGORIES, categoryParam, categoryRoute, searchQuery } from './catalog-nav'

describe('category in the address', () => {
  it.each([
    ['12', 12],
    [['1006', '12'], 1006],
    [ALL_CATEGORIES, null],
    ['', null],
    ['0', null],
    ['-5', null],
    ['1.5', null],
    ['12abc', null],
    [undefined, null],
  ] as const)('%j → %j', (value, id) => {
    expect(categoryParam(value)).toBe(id)
  })

  it('«all categories» is /category/search, as the old links have it', () => {
    expect(categoryRoute(null, searchQuery('гитара'))).toEqual({
      name: 'category',
      params: { id: 'search' },
      query: { search: 'гитара' },
    })
    expect(categoryRoute(1006)).toMatchObject({ params: { id: '1006' }, query: {} })
    expect(searchQuery('')).toEqual({})
  })
})
