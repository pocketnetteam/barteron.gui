/**
 * Collects single-key loads made close together into one request: a feed of
 * 15 cards asks for 15 seller profiles, and the node gets one
 * `getbarteronaccounts` with 15 addresses. A macrotask, not a microtask:
 * queries of one render start across several promise ticks.
 */
export function createBatcher<V>(
  loadMany: (keys: string[]) => Promise<Map<string, V>>,
  maxBatch = 50
): (key: string) => Promise<V | undefined> {
  let queue = new Map<
    string,
    { resolve: (v: V | undefined) => void; reject: (e: unknown) => void }[]
  >()
  let scheduled = false

  async function flush() {
    scheduled = false
    const current = queue
    queue = new Map()
    const keys = [...current.keys()]
    for (let i = 0; i < keys.length; i += maxBatch) {
      const chunk = keys.slice(i, i + maxBatch)
      try {
        const result = await loadMany(chunk)
        chunk.forEach((key) => current.get(key)!.forEach((w) => w.resolve(result.get(key))))
      } catch (error) {
        chunk.forEach((key) => current.get(key)!.forEach((w) => w.reject(error)))
      }
    }
  }

  return (key) =>
    new Promise((resolve, reject) => {
      const waiting = queue.get(key) ?? []
      waiting.push({ resolve, reject })
      queue.set(key, waiting)
      if (!scheduled) {
        scheduled = true
        setTimeout(() => void flush(), 0)
      }
    })
}
