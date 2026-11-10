<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'

/** Stage 0 home: shows what the host told us. Stage 3 replaces it with the real home page. */
const session = useSessionStore()
const { t, locale } = useI18n()

const rows = computed(() => {
  const info = session.appinfo
  return [
    {
      key: 'mode',
      label: t('status.mode'),
      value: session.mode === 'mock' ? t('status.modeMock') : t('status.modeBastyon'),
    },
    { key: 'host', label: t('status.host'), value: info?.project?.name ?? '—' },
    { key: 'device', label: t('status.device'), value: info?.device ?? '—' },
    {
      key: 'network',
      label: t('status.network'),
      value: info?.production === false ? t('status.networkTest') : t('status.networkMain'),
    },
    { key: 'locale', label: t('status.locale'), value: `${locale.value} (${info?.locale ?? '—'})` },
    { key: 'theme', label: t('status.theme'), value: session.hostTheme ?? '—' },
    { key: 'app', label: t('status.app'), value: info?.application?.id ?? '—' },
  ]
})

const HASH = '0'.repeat(64)
const sampleRoutes = [
  '/category/1',
  `/barter/${HASH}`,
  `/barter/exchange/${HASH}`,
  '/barter/safedeal?deal=demo',
  '/profile/PMockUser1111111111111111111111111',
  '/about',
  '/no-such-page',
]
</script>

<template>
  <main class="page" data-testid="home">
    <h1>{{ t('status.title') }}</h1>

    <dl class="status">
      <template v-for="row in rows" :key="row.key">
        <dt>{{ row.label }}</dt>
        <dd :data-testid="`status-${row.key}`">{{ row.value }}</dd>
      </template>

      <dt>{{ t('status.account') }}</dt>
      <dd data-testid="status-account">
        <template v-if="session.account === 'signed-in'">
          <code>{{ session.address }}</code>
        </template>
        <template v-else-if="session.account === 'no-permission'">
          {{ t('status.accountNoPermission') }}
          <button type="button" @click="session.requestAccountAccess()">
            {{ t('status.grant') }}
          </button>
        </template>
        <template v-else-if="session.account === 'guest'">
          {{ t('status.accountGuest') }}
          <button type="button" @click="session.signIn()">{{ t('status.signIn') }}</button>
        </template>
        <template v-else>—</template>
      </dd>
    </dl>

    <h2>{{ t('status.routes') }}</h2>
    <ul>
      <li v-for="path in sampleRoutes" :key="path">
        <RouterLink :to="path">{{ path }}</RouterLink>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.status {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 16px;
  margin: 0 0 24px;
}

.status dt {
  color: var(--muted);
}

.status dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.status button {
  margin-left: 8px;
}
</style>
