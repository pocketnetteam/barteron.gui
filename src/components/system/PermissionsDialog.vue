<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiDialog from '@/ui/UiDialog.vue'
import SystemState from './SystemState.vue'

/**
 * «Нужны разрешения» (s8-system-desktop): the user turned a permission off in
 * Bastyon, and only Bastyon's app settings turn it back on (old
 * `dialogLabels.disabled_permissions`, `helpers.opensettings`).
 */
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const session = useSessionStore()
const ui = useUiStore()

const list = computed(() =>
  ui.permissions.map((p) => t(`system.permissions.names.${p}`)).join(', ')
)

async function settings() {
  await session.sdk?.helpers.opensettings().catch(() => undefined)
  open.value = false
  // The user may have switched access on there.
  void session.loadAccount()
}
</script>

<template>
  <UiDialog v-model:open="open" :title="t('system.permissions.title')" hide-title :width="440">
    <SystemState
      bare
      kind="permissions"
      icon="lock"
      tone="warning"
      :title="t('system.permissions.title')"
      :text="t('system.permissions.text', { list })"
    >
      <UiButton block external data-testid="permissions-settings" @click="settings">{{
        t('system.permissions.settings')
      }}</UiButton>
      <UiButton variant="ghost" block @click="open = false">{{ t('system.notNow') }}</UiButton>
    </SystemState>
  </UiDialog>
</template>
