import { defineStore } from 'pinia'
import { computed } from 'vue'
import { offerLifecycle, type Offer } from '@/models/offer'
import { idList, useUserStored } from './stored'

/** How long before the year runs out the app offers to renew an offer. */
export const RENEW_REMIND_DAYS = 14
const DAY = 24 * 60 * 60 * 1000
/** «Не сейчас» puts the reminder off for a day. */
export const RENEW_SNOOZE_MS = DAY

/**
 * Should the app offer to renew this offer now: the year is almost over (or
 * already over) and the author has not taken it off or deleted it.
 */
export function dueForRenewal(
  offer: Pick<Offer, 'hash' | 'published' | 'till'>,
  now = Date.now()
): boolean {
  const state = offerLifecycle(offer, now)
  if (state === 'expired') return true
  return state === 'active' && offer.till - now <= RENEW_REMIND_DAYS * DAY
}

/**
 * «Автопродление» on my offer (s3-itemown) means «remind me to renew»: the
 * chain has no auto-renewal, so on entry the app finds my offers whose year
 * is running out and asks once to renew them all. On by default; the list
 * keeps the offers it is switched off for. New key, the old app had none.
 */
export const useAutorenewStore = defineStore('autorenew', () => {
  const off = useUserStored('autorenew_off', [] as string[], (v) => idList(v))
  const snoozed = useUserStored('autorenew_snooze', 0, (v) =>
    typeof v === 'number' && Number.isFinite(v) ? v : 0
  )

  const isOn = (id: string | null | undefined): boolean => !!id && !off.value.value.includes(id)

  function setOn(id: string, on: boolean) {
    const rest = off.value.value.filter((x) => x !== id)
    off.set(on ? rest : [...rest, id])
  }

  /** My offers to offer for renewal now, unless the reminder was put off. */
  function due(mine: readonly Offer[], now = Date.now()): Offer[] {
    if (now - snoozed.value.value < RENEW_SNOOZE_MS) return []
    return mine.filter((o) => isOn(o.hash) && dueForRenewal(o, now))
  }

  function snooze(now = Date.now()) {
    snoozed.set(now)
  }

  return { off: computed(() => off.value.value), isOn, setOn, due, snooze }
})
