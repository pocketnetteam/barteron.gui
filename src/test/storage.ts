/**
 * Storage the browser refuses: a third-party frame with blocked site data —
 * Chrome in incognito, where Bastyon on the web opens Barteron from another
 * origin — throws on the very first touch of `localStorage`. Returns the undo.
 */
export function blockStorage(): () => void {
  const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Access is denied for this document.', 'SecurityError')
    },
  })
  return () => Object.defineProperty(globalThis, 'localStorage', real)
}

/**
 * Swaps `localStorage` for one whose writes go through `setItem`. The whole
 * object is swapped: happy-dom's `localStorage` is a Proxy that keeps the
 * methods it handed out, so a spy on `Storage.prototype` set after the first
 * write in a file is not called — it depends on which test ran first.
 */
function swapStorage(setItem: (key: string, value: string) => void): () => void {
  const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!
  const store = localStorage
  const swapped = {
    getItem: (key: string) => store.getItem(key),
    removeItem: (key: string) => store.removeItem(key),
    key: (index: number) => store.key(index),
    clear: () => store.clear(),
    get length() {
      return store.length
    },
    setItem,
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => swapped })
  return () => Object.defineProperty(globalThis, 'localStorage', real)
}

/** Storage that is full: every write throws, reads still work. Returns the undo. */
export function fillStorage(): () => void {
  return swapStorage(() => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
  })
}

/** Storage that works and records every write, in order. */
export function recordStorage(): { writes: [key: string, value: string][]; restore: () => void } {
  const store = localStorage
  const writes: [string, string][] = []
  const restore = swapStorage((key, value) => {
    writes.push([key, value])
    store.setItem(key, value)
  })
  return { writes, restore }
}
