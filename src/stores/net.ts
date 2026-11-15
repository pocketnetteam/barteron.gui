import { onlineManager } from '@tanstack/vue-query'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Failed node requests in a row with no answer in between: then the node is
 * not answering at all, not just one request failing (s8-system «Нода не
 * отвечает»). One answer clears it.
 */
export const OFFLINE_AFTER = 3

/** Whether the node answers, from the reads the app makes anyway. */
export const useNetStore = defineStore('net', () => {
  const failures = ref(0)
  /**
   * The device itself is offline. The query client then puts every read on
   * hold instead of failing it, so the node never «stops answering» — the
   * lists would wait in silence.
   */
  const deviceOffline = ref(!onlineManager.isOnline())
  onlineManager.subscribe((online) => {
    deviceOffline.value = !online
  })
  const offline = computed(() => failures.value >= OFFLINE_AFTER || deviceOffline.value)

  function report(answered: boolean): void {
    failures.value = answered ? 0 : failures.value + 1
  }

  return { failures, deviceOffline, offline, report }
})
