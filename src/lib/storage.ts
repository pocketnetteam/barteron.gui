/**
 * localStorage the way the old app kept it: JSON under `<address>_<id>`, or
 * `<id>` before the address is known (barteron.gui `src/stores/store.js`).
 * The new version replaces the old one on the same origin, barteron.club, so
 * the same keys carry favourites, currency and location over.
 *
 * Storage may refuse: Chrome in incognito blocks it in a frame from another
 * origin, which is how Bastyon on the web opens Barteron, and a full storage
 * throws on write. Then reads fall back, and a value that could not be written
 * lives in memory until reload: the draft preview and the form opened again
 * in this visit still find the draft.
 */

/** Values the device would not take, as JSON: they live until reload. */
const memory = new Map<string, string>()

export const userKey = (id: string, address?: string | null): string =>
  address ? `${address}_${id}` : id

export function readStored<T>(key: string, fallback: T): T {
  try {
    // Kept in memory: newer than whatever the device still has under the key.
    const raw = memory.get(key) ?? localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

/** `false` — the device did not take it: blocked or full storage. */
export function writeStored(key: string, value: unknown): boolean {
  const json = JSON.stringify(value)
  try {
    localStorage.setItem(key, json)
    memory.delete(key)
    return true
  } catch {
    memory.set(key, json)
    return false
  }
}

export function removeStored(key: string): void {
  memory.delete(key)
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage unavailable: nothing was kept anyway.
  }
}

/** Keys that start with `prefix`: the drafts of one user. */
export function storedKeys(prefix: string): string[] {
  const keys = new Set([...memory.keys()].filter((key) => key.startsWith(prefix)))
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) keys.add(key)
    }
  } catch {
    // Storage unavailable: only what this visit holds.
  }
  return [...keys]
}

/**
 * Everything written is on the device and storage works: what the user did
 * survives a restart. Asked before promising that («Вышла новая версия»).
 */
export function storageKeepsAll(): boolean {
  if (memory.size) return false
  try {
    const probe = 'barteron.probe'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Calls `changed` when another tab of the app — or the old version — writes
 * the key or clears storage. The browser fires `storage` in the other
 * documents only, so a store reads its value again before it next writes,
 * instead of overwriting the other tab's change with its stale copy.
 */
export function onStorageChange(key: () => string, changed: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key !== null && event.key !== key()) return
    // What the other tab wrote is newer than a value this tab could not write.
    if (event.key !== null) memory.delete(event.key)
    changed()
  }
  window.addEventListener('storage', listener)
  return () => window.removeEventListener('storage', listener)
}
