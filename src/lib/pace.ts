export interface PaceOptions {
  /** Goes ahead of the queue: someone is waiting for this answer. */
  urgent?: boolean
  /** Aborted while waiting: the task leaves the queue and never runs. */
  signal?: AbortSignal
}

/**
 * Urgent tasks in a row before a regular one that waits gets its turn: a user
 * who keeps searching must not hold every place name back for good.
 */
export const URGENT_IN_ROW = 3

interface Job {
  run: () => Promise<void>
  urgent: boolean
}

const aborted = (signal: AbortSignal) =>
  signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')

/**
 * Runs tasks one at a time, each starting at least `gapMs` after the previous
 * one started. Nominatim allows one request a second from an address, and the
 * header, the offer page and the lists of «Что продают рядом» ask it at once.
 *
 * Urgent tasks go first, in the order they came, but no more than
 * `URGENT_IN_ROW` of them while a regular task waits. A running task is not
 * stopped by its signal: the task itself decides what to do with it.
 */
export function createPacer(gapMs: number) {
  const queue: Job[] = []
  let busy = false
  let lastStart = -Infinity
  let urgentRun = 0

  function take(): Job | undefined {
    const urgentAt = queue.findIndex((j) => j.urgent)
    const regularAt = queue.findIndex((j) => !j.urgent)
    const urgent = urgentAt >= 0 && (regularAt < 0 || urgentRun < URGENT_IN_ROW)
    const at = urgent ? urgentAt : regularAt
    if (at < 0) return undefined
    urgentRun = urgent ? urgentRun + 1 : 0
    return queue.splice(at, 1)[0]
  }

  async function pump() {
    if (busy) return
    busy = true
    try {
      while (queue.length) {
        const wait = lastStart + gapMs - Date.now()
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
        const job = take()
        if (!job) break
        lastStart = Date.now()
        await job.run()
      }
    } finally {
      busy = false
      // A quiet queue starts a new count: the next search is not held back.
      if (!queue.length) urgentRun = 0
    }
  }

  return function pace<T>(task: () => Promise<T>, options: PaceOptions = {}): Promise<T> {
    const { signal, urgent = false } = options
    if (signal?.aborted) return Promise.reject(aborted(signal))
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        const index = queue.indexOf(job)
        if (index < 0) return
        queue.splice(index, 1)
        reject(aborted(signal!))
      }
      const job: Job = {
        urgent,
        run: () => {
          signal?.removeEventListener('abort', onAbort)
          return Promise.resolve().then(task).then(resolve, reject)
        },
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      queue.push(job)
      void pump()
    })
  }
}
