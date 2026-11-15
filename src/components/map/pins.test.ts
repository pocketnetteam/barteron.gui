import { describe, expect, it } from 'vitest'
import { layoutPins } from './pins'

const at = (x: number, y: number) => ({ x, y })

describe('price pills on the catalog map', () => {
  it('far apart: one pill each, where the offer is', () => {
    const layout = layoutPins(
      [
        { item: 'a', px: at(0, 0) },
        { item: 'b', px: at(100, 0) },
      ],
      false
    )
    expect(layout).toEqual([
      { kind: 'one', item: 'a', at: at(0, 0) },
      { kind: 'one', item: 'b', at: at(100, 0) },
    ])
  })

  it('close ones join into «+N» until the last zoom', () => {
    const layout = layoutPins(
      [
        { item: 'a', px: at(0, 0) },
        { item: 'b', px: at(10, 10) },
        { item: 'c', px: at(300, 0) },
      ],
      false
    )
    expect(layout).toEqual([
      { kind: 'group', items: ['a', 'b'], at: at(0, 0) },
      { kind: 'one', item: 'c', at: at(300, 0) },
    ])
  })

  it('at the last zoom, offers at one point are laid out apart, each its own pill', () => {
    const same = ['a', 'b', 'c'].map((item) => ({ item, px: at(500, 500) }))
    const layout = layoutPins(same, true)
    expect(layout.map((p) => p.kind)).toEqual(['one', 'one', 'one'])
    expect(layout.map((p) => (p.kind === 'one' ? p.item : null))).toEqual(['a', 'b', 'c'])
    // A column around the point, pills a full height apart.
    const ys = layout.map((p) => p.at.y)
    expect(ys).toEqual([464, 500, 536])
    expect(layout.every((p) => p.at.x === 500)).toBe(true)
  })

  it('many at one point: columns side by side, none on top of another', () => {
    const same = Array.from({ length: 14 }, (_, i) => ({ item: i, px: at(0, 0) }))
    const spots = layoutPins(same, true).map((p) => `${p.at.x}:${p.at.y}`)
    expect(new Set(spots).size).toBe(14)
    const xs = [...new Set(layoutPins(same, true).map((p) => p.at.x))]
    expect(xs).toEqual([-120, 0, 120])
  })
})
