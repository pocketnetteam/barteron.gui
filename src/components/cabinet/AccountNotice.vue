<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { useMyAccount } from '@/composables/my-account'
import { txErrorText } from '@/lib/tx-errors'
import UiAlert from '@/ui/UiAlert.vue'
import UiButton from '@/ui/UiButton.vue'

/**
 * What is happening to my profile in the network (s5-states): being updated,
 * refused by the node (with a retry), or the account still activating.
 */
const props = defineProps<{ account: ReturnType<typeof useMyAccount>; compact?: boolean }>()
const { t } = useI18n()

const reason = computed(() => {
  const error = props.account.failed.value?.error
  return error ? txErrorText(error, t) : ''
})
</script>

<template>
  <UiAlert
    v-if="account.pending.value"
    tone="warning"
    busy
    live
    :title="compact ? undefined : t('account.updating')"
    data-testid="account-updating"
  >
    {{ compact ? t('account.updatingShort') : t('account.updatingText') }}
  </UiAlert>
  <UiAlert
    v-else-if="account.failed.value"
    tone="danger"
    live
    :title="t('account.failed')"
    data-testid="account-failed"
  >
    {{ t('account.failedText', { reason }) }}
    <template #action>
      <UiButton
        variant="on-danger"
        :size="36"
        data-testid="account-retry"
        @click="account.retry()"
        >{{ t('ui.retry') }}</UiButton
      >
    </template>
  </UiAlert>
  <UiAlert v-else-if="account.activating.value" tone="info" busy data-testid="account-activating">
    {{ t('account.activating') }}
  </UiAlert>
</template>
