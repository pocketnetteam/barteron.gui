import { describe, expect, it } from 'vitest'
import { parseBalance } from './wallet'

describe('balance from either host', () => {
  it('previous Bastyon: actual; bastyon-nextgen: available', () => {
    expect(parseBalance({ actual: 842.5, tempbalance: 0 })).toBe(842.5)
    expect(parseBalance({ available: 1.5, frozen: 0.2 })).toBe(1.5)
    expect(parseBalance({ total: 0 })).toBe(0)
    expect(parseBalance('12')).toBeNull()
    expect(parseBalance({})).toBeNull()
    expect(parseBalance(null)).toBeNull()
  })
})
