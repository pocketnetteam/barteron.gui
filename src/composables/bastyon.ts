import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { showToast } from '@/ui/toast'

/**
 * Opens a user's profile in Bastyon. The old app sent `('username', name)`,
 * which the old host takes; bastyon-nextgen takes `address` or `name`
 * (HOST-TASKS.md item 4), so `address` is the fallback.
 */
export function useBastyonProfile() {
  const session = useSessionStore()
  const { t } = useI18n()
  const failed = () => showToast(t('system.profileFailed'), { kind: 'error' })

  return async function openProfile(address: string, name?: string | null): Promise<void> {
    const open = session.sdk?.open.profile
    if (!open) {
      failed()
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
    await open('address', address).catch(failed)
  }
}
