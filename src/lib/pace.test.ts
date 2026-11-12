import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPacer } from './pace'

describe('pacer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const started: string[] = []
  const at: number[] = []
  const task =
    (name: string, fail = false) =>
    async () => {
      started.push(name)
      at.push(Date.now())
      if (fail) throw new Error(name)
      return name
    }
  beforeEach(() => {
    started.length = 0
    at.length = 0
  })

  it('starts one task a second, in order, and passes errors on', async () => {
    const pace = createPacer(1000)
    const results = Promise.allSettled([pace(task('a')), pace(task('b', true)), pace(task('c'))])
    await vi.advanceTimersByTimeAsync(2000)
    expect(await results).toEqual([
      { status: 'fulfilled', value: 'a' },
      { status: 'rejected', reason: new Error('b') },
      { status: 'fulfilled', value: 'c' },
    ])
    expect(started).toEqual(['a', 'b', 'c'])
    expect(at.map((t) => t - at[0]!)).toEqual([0, 1000, 2000])
  })

  it('an urgent task goes ahead of the waiting ones', async () => {
    const pace = createPacer(1000)
    const all = Promise.all([pace(task('a')), pace(task('b')), pace(task('now'), { urgent: true })])
    await vi.advanceTimersByTimeAsync(2000)
    await all
    expect(started).toEqual(['a', 'now', 'b'])
  })

  it('an aborted task leaves the queue without running and frees its turn', async () => {
    const pace = createPacer(1000)
    const controller = new AbortController()
    const first = pace(task('a'))
    const dropped = pace(task('gone'), { signal: controller.signal })
    const last = pace(task('c'))
    controller.abort()
    await expect(dropped).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(1000)
    expect(await Promise.all([first, last])).toEqual(['a', 'c'])
    expect(started).toEqual(['a', 'c'])
    expect(at[1]! - at[0]!).toBe(1000)
    await expect(pace(task('late'), { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
  })

  it('after a quiet second the next task starts at once', async () => {
    const pace = createPacer(1000)
    await pace(task('a'))
    await vi.advanceTimersByTimeAsync(1500)
    const startedBefore = Date.now()
    await pace(task('b'))
    expect(at[1]).toBe(startedBefore)
  })
})
