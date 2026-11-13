import { shallowRef } from 'vue'

/**
 * The ban list loads in its own chunk: 691 addresses barely compress (about
 * 18 kB gzip) and are only needed once node data arrives. Every node read
 * waits for it (`BarteronApi`), and so does every write (`useTxStore`).
 *
 * The ban works in the client only, as in the old app: the network accepts
 * anything a banned address signs; Barteron hides it and does not send it.
 */

/** Reactive: a `computed` that asked before the list came asks again. */
const banned = shallowRef<ReadonlySet<string> | null>(null)
let loading: Promise<void> | null = null

export function loadBanList(): Promise<void> {
  loading ??= import('./ban-list')
    .then((m) => {
      banned.value = new Set(m.BAN_LIST)
    })
    .catch((error) => {
      loading = null
      throw error
    })
  return loading
}

/** The list has come: `isBanned` answers for real. */
export const banListLoaded = (): boolean => banned.value !== null

/** False until the list is loaded: call `loadBanList` first. */
export const isBanned = (address: string | null | undefined): boolean =>
  !!address && !!banned.value?.has(address)

/** Drops items whose author is banned (old `banProcessor.filteredOffers`). */
export const withoutBanned = <T extends { address?: string | null }>(items: readonly T[]): T[] =>
  items.filter((item) => !isBanned(item.address))

/**
 * Waits for the list; for a banned address never resolves: the action hangs,
 * like `infiniteAction` of the old app (writes, chat, photos, video, survey).
 * A list that cannot load lets the action go: node reads fail without it anyway.
 */
export async function hangIfBanned(address: string | null | undefined): Promise<void> {
  await loadBanList().catch(() => undefined)
  if (isBanned(address)) await new Promise<never>(() => {})
}
