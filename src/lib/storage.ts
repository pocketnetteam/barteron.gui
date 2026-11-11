/**
 * localStorage the way the old app kept it: JSON under `<address>_<id>`, or
 * `<id>` before the address is known (barteron.gui `src/stores/store.js`).
 * The new version replaces the old one on the same origin, barteron.club, so
 * the same keys carry favourites, currency and location over.
 *
 * Storage may be missing (private mode, blocked site data): reads fall back,
 * writes are dropped.
 */

export const userKey = (id: string, address?: string | null): string =>
  address ? `${address}_${id}` : id

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the value lives until reload.
  }
}

export function removeStored(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage unavailable: nothing was kept anyway.
  }
}

/** Keys that start with `prefix`: the drafts of one user. */
export function storedKeys(prefix: string): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) keys.push(key)
    }
    return keys
  } catch {
    return []
  }
}
