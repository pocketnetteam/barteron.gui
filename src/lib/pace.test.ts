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

  it('urgent tasks keep the order they came in', async () => {
    const pace = createPacer(1000)
    const all = Promise.all([
      pace(task('a')),
      pace(task('u1'), { urgent: true }),
      pace(task('u2'), { urgent: true }),
    ])
    await vi.advanceTimersByTimeAsync(3000)
    await all
    expect(started).toEqual(['a', 'u1', 'u2'])
  })

  it('a stream of urgent tasks lets a waiting one through', async () => {
    const pace = createPacer(1000)
    const all = [pace(task('first')), pace(task('waiting'))]
    for (let i = 1; i <= 5; i++) all.push(pace(task(`u${i}`), { urgent: true }))
    await vi.advanceTimersByTimeAsync(10_000)
    await Promise.all(all)
    expect(started).toEqual(['first', 'u1', 'u2', 'u3', 'waiting', 'u4', 'u5'])
  })

  it('after a quiet queue an urgent task goes first again', async () => {
    const pace = createPacer(1000)
    const streak = [pace(task('a'))]
    for (let i = 1; i <= 3; i++) streak.push(pace(task(`u${i}`), { urgent: true }))
    await vi.advanceTimersByTimeAsync(3000)
    await Promise.all(streak)
    started.length = 0
    // Both come within the second after the last task and wait together.
    const next = Promise.all([pace(task('later')), pace(task('now'), { urgent: true })])
    await vi.advanceTimersByTimeAsync(2000)
    await next
    expect(started).toEqual(['now', 'later'])
  })

  it('an urgent task that starts at once counts among the three; a quiet queue counts anew', async () => {
    const pace = createPacer(1000)
    const burst = async (n: number) => {
      // The first starts at once, the rest wait for their second.
      const all = [pace(task(`u1-${n}`), { urgent: true }), pace(task(`r-${n}`))]
      for (let i = 2; i <= 4; i++) all.push(pace(task(`u${i}-${n}`), { urgent: true }))
      await vi.advanceTimersByTimeAsync(5000)
      await Promise.all(all)
    }
    await burst(1)
    await vi.advanceTimersByTimeAsync(3000)
    await burst(2)
    expect(started).toEqual([
      ...['u1-1', 'u2-1', 'u3-1', 'r-1', 'u4-1'],
      ...['u1-2', 'u2-2', 'u3-2', 'r-2', 'u4-2'],
    ])
  })

  it('a task that fails at once does not stop the queue', async () => {
    const pace = createPacer(1000)
    const broken = pace(() => {
      throw new Error('sync')
    }).catch((error: Error) => error)
    const after = pace(task('b'))
    await vi.advanceTimersByTimeAsync(1000)
    expect(await broken).toMatchObject({ message: 'sync' })
    expect(await after).toBe('b')
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
