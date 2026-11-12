export interface PaceOptions {
  /** Goes ahead of the queue: someone is waiting for this answer. */
  urgent?: boolean
  /** Aborted while waiting: the task leaves the queue and never runs. */
  signal?: AbortSignal
}

const aborted = (signal: AbortSignal) =>
  signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')

/**
 * Runs tasks one at a time, each starting at least `gapMs` after the previous
 * one started. Nominatim allows one request a second from an address, and the
 * header, the offer page and the lists of «Что продают рядом» ask it at once.
 */
export function createPacer(gapMs: number) {
  const queue: { run: () => Promise<void> }[] = []
  let busy = false
  let lastStart = -Infinity

  async function pump() {
    if (busy) return
    busy = true
    try {
      while (queue.length) {
        const wait = lastStart + gapMs - Date.now()
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
        const job = queue.shift()
        if (!job) break
        lastStart = Date.now()
        await job.run()
      }
    } finally {
      busy = false
    }
  }

  return function pace<T>(task: () => Promise<T>, options: PaceOptions = {}): Promise<T> {
    const { signal, urgent } = options
    if (signal?.aborted) return Promise.reject(aborted(signal))
    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        const index = queue.indexOf(job)
        if (index < 0) return
        queue.splice(index, 1)
        reject(aborted(signal!))
      }
      const job = {
        run: () => {
          signal?.removeEventListener('abort', onAbort)
          return Promise.resolve().then(task).then(resolve, reject)
        },
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      if (urgent) queue.unshift(job)
      else queue.push(job)
      void pump()
    })
  }
}
