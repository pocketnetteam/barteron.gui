import { describe, expect, it } from 'vitest'
import { createLimiter } from './limit'

describe('limiter', () => {
  it('runs at most two at a time, in order, and passes errors on', async () => {
    const limit = createLimiter(2)
    let running = 0
    let peak = 0
    const order: number[] = []
    const task = (n: number, fail = false) =>
      limit(async () => {
        running++
        peak = Math.max(peak, running)
        await new Promise((r) => setTimeout(r, 5))
        running--
        order.push(n)
        if (fail) throw new Error(`task ${n}`)
        return n
      })
    const results = await Promise.allSettled([task(1), task(2, true), task(3), task(4)])
    expect(peak).toBe(2)
    expect(order).toEqual([1, 2, 3, 4])
    expect(results.map((r) => r.status)).toEqual([
      'fulfilled',
      'rejected',
      'fulfilled',
      'fulfilled',
    ])
  })
})
