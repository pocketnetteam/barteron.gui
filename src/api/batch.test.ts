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

describe('createBatcher: partial failure', () => {
  it('a failed part of a big batch does not fail the rest', async () => {
    const loadMany = vi.fn(async (keys: string[]) => {
      if (keys.includes('a')) throw new Error('node refused')
      return new Map(keys.map((k) => [k, k]))
    })
    const load = createBatcher(loadMany, 2)
    const results = await Promise.allSettled(['a', 'b', 'c'].map(load))
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected', 'fulfilled'])
    expect(loadMany.mock.calls).toEqual([[['a', 'b']], [['c']]])
  })

  it('keys asked after a request started go into the next one', async () => {
    let release = () => {}
    const loadMany = vi.fn(
      (keys: string[]) =>
        new Promise<Map<string, string>>((resolve) => {
          release = () => resolve(new Map(keys.map((k) => [k, k])))
        })
    )
    const load = createBatcher(loadMany)
    const first = load('a')
    await new Promise((r) => setTimeout(r, 0))
    const second = load('b')
    release()
    expect(await first).toBe('a')
    await new Promise((r) => setTimeout(r, 0))
    release()
    expect(await second).toBe('b')
    expect(loadMany.mock.calls).toEqual([[['a']], [['b']]])
  })
})

it('createBatcher: keys asked a few promise ticks apart still go together', async () => {
  const loadMany = vi.fn(async (keys: string[]) => new Map(keys.map((k) => [k, k])))
  const load = createBatcher(loadMany)
  const first = load('a')
  await Promise.resolve()
  await Promise.resolve()
  const second = load('b')
  await Promise.all([first, second])
  expect(loadMany.mock.calls).toEqual([[['a', 'b']]])
})
