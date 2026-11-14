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
 * Storage that is full: every write throws, reads still work. Returns the
 * undo. The whole object is swapped: happy-dom's `localStorage` is a Proxy
 * that keeps the methods it handed out, so a spy on `Storage.prototype` set
 * after the first write is not always called.
 */
export function fillStorage(): () => void {
  const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')!
  const store = localStorage
  const full = {
    getItem: (key: string) => store.getItem(key),
    removeItem: (key: string) => store.removeItem(key),
    key: (index: number) => store.key(index),
    clear: () => store.clear(),
    get length() {
      return store.length
    },
    setItem() {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => full })
  return () => Object.defineProperty(globalThis, 'localStorage', real)
}
