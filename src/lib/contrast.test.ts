import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor } from './contrast'

describe('parseColor', () => {
  it.each([
    ['#fff', [255, 255, 255]],
    ['#5B3CF0', [91, 60, 240]],
    [' #16161d ', [22, 22, 29]],
    ['rgb(16, 16, 22)', [16, 16, 22]],
    ['rgba(0, 0, 0, 0.64)', [0, 0, 0]],
  ])('%s', (value, rgb) => {
    expect(parseColor(value)).toEqual(rgb)
  })

  it('returns null for what it cannot read', () => {
    expect(parseColor('var(--x)')).toBeNull()
    expect(parseColor('')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1)
  })

  it('matches the foundations sheet: white on action/primary is 6.3:1', () => {
    expect(contrastRatio([255, 255, 255], parseColor('#5B3CF0')!)).toBeCloseTo(6.3, 1)
  })

  it('does not depend on the order', () => {
    const a = parseColor('#68687A')!
    const b = parseColor('#F4F4F6')!
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a))
  })
})
