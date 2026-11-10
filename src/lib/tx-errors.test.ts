import { describe, expect, it } from 'vitest'
import { errorText } from '@/stores/tx'
import { txErrorKey, txErrorText } from './tx-errors'

describe('why a transaction did not go', () => {
  it('the previous host rejects with the node code; it stays a number in text', () => {
    expect(errorText(new Error('-26'))).toBe('-26')
    expect(errorText({ code: -26 })).toBe('-26')
    expect(errorText({ error: { code: 28 } })).toBe('28')
    expect(errorText(65)).toBe('65')
  })

  it('codes the old app explained become its words', () => {
    const t = (key: string) => `[${key}]`
    expect(txErrorText('-26', t)).toBe('[txError.fee]')
    expect(txErrorText('min relay fee not met', t)).toBe('[txError.fee]')
    expect(txErrorKey('28')).toBe('tooMany')
    expect(txErrorKey('brtoffer:invalid:geohash')).toBe('invalid')
    expect(txErrorKey('not_authenticated')).toBe('signIn')
    expect(txErrorKey('999')).toBe('unknown')
  })

  it('bastyon-nextgen already sends a sentence: shown as it is', () => {
    const t = (key: string) => `[${key}]`
    expect(txErrorText('Недостаточно монет для комиссии', t)).toBe(
      'Недостаточно монет для комиссии'
    )
  })
})
