<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import SystemState from './SystemState.vue'

/**
 * «Аккаунт активируется» (s8-system-desktop): a new Bastyon account is not on
 * the node yet. Looking around works; writing to a seller and publishing wait
 * until the network confirms the account.
 */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
</script>

<template>
  <UiDialog v-model:open="open" :title="t('system.activation.title')" hide-title :width="440">
    <SystemState
      bare
      kind="activation"
      icon="clock"
      tone="info"
      :title="t('system.activation.title')"
      :text="t('system.activation.text')"
      :notes="[
        { ok: true, text: t('system.activation.works') },
        { ok: false, text: t('system.activation.waits') },
      ]"
    >
      <UiButton block data-testid="activation-ok" @click="open = false">{{
        t('system.activation.browse')
      }}</UiButton>
    </SystemState>
  </UiDialog>
</template>
