import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { NotifyChannel } from '@/api/notify'
import { isJsonObject, type JsonObject } from '@/models/tx'
import { useUserStored } from './stored'

/**
 * What the device remembers about notifications:
 * - «Больше не показывать» on the reminder: the old key `<address>_profile`,
 *   field `notificationsBannerDisabled`, so a choice made in the old app holds;
 * - channels seen connected (new key `<address>_notify_connected`): the
 *   reminder is not needed then, and asking p2p.back for it would mean a
 *   signature on every visit.
 */
export const useNotifyPrefsStore = defineStore('notify-prefs', () => {
  const oldProfile = useUserStored<JsonObject>('profile', {}, (v) => (isJsonObject(v) ? v : {}))
  const connected = useUserStored<NotifyChannel[]>('notify_connected', [], (v) =>
    Array.isArray(v) ? v.filter((c): c is NotifyChannel => c === 'telegram' || c === 'vk') : []
  )

  const reminderOff = computed(() => oldProfile.value.value.notificationsBannerDisabled === true)
  const anyConnected = computed(() => connected.value.value.length > 0)

  function turnReminderOff() {
    oldProfile.set({ ...oldProfile.value.value, notificationsBannerDisabled: true })
  }

  function setConnected(channel: NotifyChannel, on: boolean) {
    const list = connected.value.value
    if (list.includes(channel) === on) return
    connected.set(on ? [...list, channel] : list.filter((c) => c !== channel))
  }

  /** Show «Не пропустите покупателя»: nothing connected and not turned off. */
  const showReminder = computed(() => !reminderOff.value && !anyConnected.value)

  return { reminderOff, anyConnected, showReminder, turnReminderOff, setConnected }
})
