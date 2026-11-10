/**
 * The ban list loads in its own chunk: 691 addresses barely compress (about
 * 18 kB gzip) and are only needed once node data arrives. Every node read
 * waits for it (`BarteronApi`), and so does every write (`useTxStore`).
 */

let banned: ReadonlySet<string> | null = null
let loading: Promise<void> | null = null

export function loadBanList(): Promise<void> {
  loading ??= import('./ban-list')
    .then((m) => {
      banned = new Set(m.BAN_LIST)
    })
    .catch((error) => {
      loading = null
      throw error
    })
  return loading
}

/** False until the list is loaded: call `loadBanList` first. */
export const isBanned = (address: string | null | undefined): boolean =>
  !!address && !!banned?.has(address)

/** Drops items whose author is banned (old `banProcessor.filteredOffers`). */
export const withoutBanned = <T extends { address?: string | null }>(items: readonly T[]): T[] =>
  items.filter((item) => !isBanned(item.address))
