import { computed } from 'vue'
import { useAccount, useUserProfile } from '@/api/queries'
import { accountFromAlias, toAccountPayload, type BarteronAccount } from '@/models/account'
import { useSessionStore } from '@/stores/session'
import { useTxStore, type TrackedTx } from '@/stores/tx'

/**
 * My Barteron profile (tx 104) for the cabinet: «Мой список», the place for
 * new offers, the guarantor's and the moderator's settings. One profile holds
 * them all, so every save sends the whole profile with one change.
 *
 * - `shown` — what to show: the version on its way while the host sends it
 *   (and until the node returns it), otherwise the node's;
 * - `pending` — a version is on its way: editing waits for it, like in the old
 *   app («Редактирование станет доступно после подтверждения»);
 * - `failed` — the node refused the last save; `retry` sends it again.
 */
export function useMyAccount() {
  const session = useSessionStore()
  const tx = useTxStore()
  const me = computed(() => session.address)
  const query = useAccount(me)
  const profile = useUserProfile(me)

  const latest = computed(() => tx.latestFor(me.value, ['account']))
  const pending = computed(
    () => !!latest.value && (latest.value.status === 'sending' || latest.value.status === 'waiting')
  )
  const failed = computed<TrackedTx | null>(() =>
    latest.value?.status === 'failed' ? latest.value : null
  )

  const shown = computed<BarteronAccount | null>(() => {
    const base = query.data.value ?? null
    const t = latest.value
    if (!t || t.status === 'failed') return base
    // Done, but the node still answers with the old version: keep the new one.
    if (t.status === 'done' && (!t.txid || base?.hash === t.txid)) return base
    return accountFromAlias(t.payload, base) ?? base
  })

  /** No Bastyon profile on the node yet: the host would not send a profile. */
  const activating = computed(
    () => profile.isSuccess.value && (!profile.data.value || !profile.data.value.name)
  )

  /** Saving is possible: the profile is known, nothing on its way, the account is active. */
  const canSave = computed(() => !!query.data.value && !pending.value && !activating.value)

  /**
   * Sends the profile with one change. Built on the last confirmed version,
   * even if the node has not returned it yet; a failed save is not a base.
   */
  function save(change: (account: BarteronAccount) => BarteronAccount): Promise<TrackedTx> | null {
    const base = failed.value ? query.data.value : shown.value
    if (!base || !canSave.value) return null
    return tx.send('account', toAccountPayload(change(base)))
  }

  return {
    query,
    shown,
    pending,
    failed,
    activating,
    canSave,
    save,
    retry: () => (failed.value ? tx.retry(failed.value.id) : null),
    dismiss: () => failed.value && tx.dismiss(failed.value.id),
  }
}
