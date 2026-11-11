import { describe, expect, it } from 'vitest'
import { cabinetRoute, sectionFromHash } from './cabinet'

describe('cabinet sections in the hash', () => {
  it('old profile tabs and the new sections', () => {
    expect(sectionFromHash('#ads')).toBe('ads')
    expect(sectionFromHash('#barters')).toBe('barters')
    expect(sectionFromHash('#favorites')).toBe('favorites')
    expect(sectionFromHash('#votes')).toBe('votes')
    expect(sectionFromHash('#settings')).toBe('settings')
    expect(sectionFromHash('#public')).toBe('public')
  })

  it('anything else is no section', () => {
    expect(sectionFromHash('')).toBeNull()
    expect(sectionFromHash('#reviews')).toBeNull()
    expect(sectionFromHash(undefined)).toBeNull()
  })

  it('route to a section', () => {
    expect(cabinetRoute('PMe', 'wallet')).toEqual({
      name: 'profile',
      params: { id: 'PMe' },
      hash: '#wallet',
    })
    expect(cabinetRoute('PMe').hash).toBe('')
  })
})
