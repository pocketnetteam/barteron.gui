<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

/** Placeholder for screens that arrive in later stages. Shows what the router parsed. */
const route = useRoute()
const { t } = useI18n()

const params = computed(() => JSON.stringify(route.params))
const query = computed(() => JSON.stringify(route.query))
</script>

<template>
  <main class="page" data-testid="stub">
    <h1 data-testid="stub-title">{{ t('stub.title', { name: String(route.name) }) }}</h1>
    <p>
      {{ t('stub.params') }}: <code data-testid="stub-params">{{ params }}</code>
    </p>
    <p>
      {{ t('stub.query') }}: <code data-testid="stub-query">{{ query }}</code>
    </p>
    <RouterLink to="/">{{ t('stub.home') }}</RouterLink>
  </main>
</template>
