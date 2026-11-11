/**
 * Runs at most `max` tasks at a time; the rest wait in order. The exchanges
 * section asks the node about every group of my offers, and a burst of
 * twenty requests at once would slow every other screen down.
 */
export function createLimiter(max: number) {
  let running = 0
  const waiting: (() => void)[] = []

  const next = () => {
    if (running >= max) return
    const start = waiting.shift()
    if (start) start()
  }

  return function limit<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      waiting.push(() => {
        running++
        task()
          .then(resolve, reject)
          .finally(() => {
            running--
            next()
          })
      })
      next()
    })
  }
}
