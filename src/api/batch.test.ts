import { describe, expect, it, vi } from 'vitest'
import { createBatcher } from './batch'

describe('createBatcher', () => {
  it('loads keys asked close together in one request, repeats included', async () => {
    const loadMany = vi.fn(async (keys: string[]) => new Map(keys.map((k) => [k, k.toUpperCase()])))
    const load = createBatcher(loadMany)
    const results = await Promise.all([load('a'), load('b'), load('a')])
    expect(results).toEqual(['A', 'B', 'A'])
    expect(loadMany).toHaveBeenCalledTimes(1)
    expect(loadMany).toHaveBeenCalledWith(['a', 'b'])
  })

  it('splits big batches and reports missing keys as undefined', async () => {
    const loadMany = vi.fn(
      async (keys: string[]) => new Map(keys.filter((k) => k !== 'c').map((k) => [k, 1]))
    )
    const load = createBatcher(loadMany, 2)
    expect(await Promise.all(['a', 'b', 'c'].map(load))).toEqual([1, 1, undefined])
    expect(loadMany).toHaveBeenCalledTimes(2)
  })

  it('a failed request rejects every waiting key', async () => {
    const load = createBatcher(async () => {
      throw new Error('node down')
    })
    await expect(Promise.all([load('a'), load('b')])).rejects.toThrow('node down')
  })
})
