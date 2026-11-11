<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SystemState from '@/components/system/SystemState.vue'
// In the main bundle: when it is needed, other chunks are exactly what fails to load.
import VersionConflict from '@/components/system/VersionConflict.vue'
// A module of its own: config/roles would bring the guarantor lists into the main bundle.
import { BASTYON_APP_URL } from '@/config/links'
import { isChunkLoadError, watchVersionConflict } from '@/composables/version-conflict'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'
import UiButton from '@/ui/UiButton.vue'
import UiSpinner from '@/ui/UiSpinner.vue'
import UiToastHost from '@/ui/UiToastHost.vue'

const AutorenewPrompt = defineAsyncComponent(() => import('@/components/item/AutorenewPrompt.vue'))
const AppDialogs = defineAsyncComponent(() => import('@/components/system/AppDialogs.vue'))

const session = useSessionStore()
const ui = useUiStore()
const route = useRoute()
const showRenewals = computed(
  () =>
    session.status === 'ready' && session.account === 'signed-in' && !route.path.startsWith('/dev')
)
const { t } = useI18n()

onBeforeUnmount(watchVersionConflict(useRouter()))
onErrorCaptured((error) => {
  if (isChunkLoadError(error)) ui.versionConflict = true
})

function reload() {
  window.location.reload()
}
</script>

<template>
  <RouterView v-if="session.status === 'ready'" />

  <main v-else-if="session.status === 'outside'" class="app-state" data-testid="state-outside">
    <SystemState
      kind="outside"
      icon="external"
      tone="primary"
      :title="t('app.outside.title')"
      :text="t('app.outside.text')"
    >
      <UiButton :href="BASTYON_APP_URL" external>{{ t('app.outside.open') }}</UiButton>
    </SystemState>
  </main>

  <main v-else-if="session.status === 'failed'" class="app-state" data-testid="state-failed">
    <!-- s8-system-desktop «SDK не загрузился». -->
    <SystemState
      kind="sdk"
      icon="error"
      tone="danger"
      :title="t('app.failed.title')"
      :text="session.failReason === 'script' ? t('app.failed.script') : t('app.failed.timeout')"
    >
      <UiButton icon="retry" data-testid="state-retry" @click="reload">{{
        t('app.failed.retry')
      }}</UiButton>
      <UiButton variant="ghost" :href="BASTYON_APP_URL" external>{{
        t('app.failed.open')
      }}</UiButton>
    </SystemState>
  </main>

  <main v-else class="app-state app-state--wait" data-testid="state-connecting">
    <UiSpinner :size="28" />
    <span>{{ t('app.connecting') }}</span>
  </main>

  <template v-if="session.status === 'ready'">
    <!-- My offers whose year is running out: offer to renew them (stage 4). -->
    <AutorenewPrompt v-if="showRenewals" />
    <AppDialogs v-if="ui.dialog" />
  </template>
  <VersionConflict v-if="ui.versionConflict" />
  <UiToastHost />
</template>

<style scoped>
.app-state {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 48px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--page);
}

.app-state--wait {
  color: var(--text2);
  font-size: 15px;
}
</style>
