import { useSoon } from '@/composables/catalog-nav'
import { useSessionStore } from '@/stores/session'

/**
 * Opens a user's profile in Bastyon. The old app sent `('username', name)`,
 * which the old host takes; bastyon-nextgen takes `address` or `name`
 * (HOST-TASKS.md item 4), so `address` is the fallback.
 */
export function useBastyonProfile() {
  const session = useSessionStore()
  const soon = useSoon()

  return async function openProfile(address: string, name?: string | null): Promise<void> {
    const open = session.sdk?.open.profile
    if (!open) {
      soon()
      return
    }
    if (name) {
      try {
        await open('username', name)
        return
      } catch {
        // bastyon-nextgen: no `username`; try the address.
      }
    }
    await open('address', address).catch(() => {
      soon()
    })
  }
}
