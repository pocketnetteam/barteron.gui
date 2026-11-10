<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { t } = useI18n()
const sdkHost = import.meta.env.VITE_SDK_HOST

watchEffect(() => {
  const root = document.documentElement
  if (session.hostTheme) root.dataset.hostTheme = session.hostTheme
  else delete root.dataset.hostTheme
})

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
    <button type="button" @click="reload">{{ t('app.failed.retry') }}</button>
  </main>

  <main v-else class="page muted" data-testid="state-connecting">
    {{ t('app.connecting') }}
  </main>
</template>
