import { beforeEach, describe, expect, it } from 'vitest'
import { newDraft } from '@/models/draft'
import { cabinetRoute, forgetSentDraft, sectionFromHash } from './cabinet'
import { draftKey } from './offer-form'

describe('a refused new offer published from the cabinet', () => {
  const ME = 'PMockUser1111111111111111111111111'
  const keep = (caption: string, address: string | null = ME) =>
    localStorage.setItem(draftKey(null, address), JSON.stringify({ ...newDraft('PKOIN'), caption }))
  beforeEach(() => localStorage.clear())

  it('takes its draft from the form: no «Продолжаем черновик» for an offer already out', () => {
    keep('Планшет ')
    forgetSentDraft(ME, { caption: 'Планшет', price: 100 })
    expect(localStorage.getItem(draftKey(null, ME))).toBeNull()
  })

  it('leaves a draft begun since for another offer, and anything it cannot read', () => {
    keep('Велосипед')
    forgetSentDraft(ME, { caption: 'Планшет' })
    forgetSentDraft(ME, null)
    forgetSentDraft(ME, { caption: 42 })
    expect(localStorage.getItem(draftKey(null, ME))).not.toBeNull()
  })

  it('nobody signed in: no draft is touched, not even the one kept without an address', () => {
    keep('Велосипед', null)
    forgetSentDraft(null, { caption: 'Велосипед' })
    expect(localStorage.getItem(draftKey(null, null))).not.toBeNull()
  })
})

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
