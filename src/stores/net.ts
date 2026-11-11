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
  const offline = computed(() => failures.value >= OFFLINE_AFTER)

  function report(answered: boolean): void {
    failures.value = answered ? 0 : failures.value + 1
  }

  return { failures, offline, report }
})
