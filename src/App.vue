<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import UiButton from '@/ui/UiButton.vue'
import UiToastHost from '@/ui/UiToastHost.vue'

const session = useSessionStore()
const { t } = useI18n()
const sdkHost = import.meta.env.VITE_SDK_HOST

function reload() {
  window.location.reload()
}
</script>

<template>
  <RouterView v-if="session.status === 'ready'" />

  <main v-else-if="session.status === 'outside'" class="page" data-testid="state-outside">
    <h1>{{ t('app.outside.title') }}</h1>
    <p>{{ t('app.outside.text') }}</p>
    <a href="https://bastyon.com/application?id=barteron.pocketnet.app">
      {{ t('app.outside.open') }}
    </a>
  </main>

  <main v-else-if="session.status === 'failed'" class="page" data-testid="state-failed">
    <h1>{{ t('app.failed.title') }}</h1>
    <p v-if="session.failReason === 'script'">{{ t('app.failed.script', { host: sdkHost }) }}</p>
    <p v-else>{{ t('app.failed.timeout') }}</p>
    <UiButton icon="retry" @click="reload">{{ t('app.failed.retry') }}</UiButton>
  </main>

  <main v-else class="page muted" data-testid="state-connecting">
    {{ t('app.connecting') }}
  </main>

  <UiToastHost />
</template>
