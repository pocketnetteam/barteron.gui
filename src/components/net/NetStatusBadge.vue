<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'
import UiSpinner from '@/ui/UiSpinner.vue'

/**
 * Network status label (principle 03: honest network statuses). One pattern
 * for publishing, editing, removal, reviews, ratings and transfers:
 * sent to the node → waiting for a block → done, with a retry on failure.
 */
export type NetStatus =
  'sending' | 'waiting' | 'done' | 'removing' | 'deleting' | 'failed' | 'draft'

const props = defineProps<{
  status: NetStatus
  /** «~1 мин» for `waiting` */
  eta?: string
  /** Overrides the default text. */
  label?: string
}>()
defineEmits<{ retry: [] }>()

const { t } = useI18n()

const TONE: Record<NetStatus, string> = {
  sending: 'neutral',
  waiting: 'warning',
  done: 'success',
  removing: 'warning',
  deleting: 'warning',
  failed: 'danger',
  draft: 'neutral',
}

const text = computed(() => {
  if (props.label) return props.label
  if (props.status === 'waiting' && props.eta) return t('net.waitingEta', { eta: props.eta })
  return t(`net.${props.status}`)
})
</script>

<template>
  <span class="net" :class="`net--${TONE[status]}`" role="status">
    <UiSpinner v-if="status === 'sending'" :size="14" />
    <UiIcon v-else-if="status === 'failed'" name="error" :size="14" :stroke="2.2" />
    <span v-else-if="status !== 'draft'" class="net__dot" aria-hidden="true" />
    {{ text }}
    <button v-if="status === 'failed'" type="button" class="net__retry" @click="$emit('retry')">
      {{ t('net.retry') }}
    </button>
  </span>
</template>

<style scoped>
.net {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text2);
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.net--warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.net--success {
  background: var(--success-soft);
  color: var(--success);
}

.net--danger {
  padding-right: 6px;
  background: var(--danger-soft);
  color: var(--danger);
}

.net__dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.net__retry {
  padding: 3px 8px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--danger);
  font: 600 12px / 16px var(--font-sans);
}

.net__retry:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
