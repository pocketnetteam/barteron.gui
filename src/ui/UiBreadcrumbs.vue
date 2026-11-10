<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

export interface Crumb {
  label: string
  to?: RouteLocationRaw
}

defineProps<{ items: Crumb[] }>()
const { t } = useI18n()
</script>

<template>
  <nav class="ui-crumbs" :aria-label="t('ui.breadcrumbs')">
    <ol class="ui-crumbs__list">
      <li v-for="(item, index) in items" :key="index" class="ui-crumbs__item">
        <RouterLink
          v-if="item.to && index < items.length - 1"
          :to="item.to"
          class="ui-crumbs__link"
        >
          {{ item.label }}
        </RouterLink>
        <span v-else aria-current="page" class="ui-crumbs__current">{{ item.label }}</span>
        <span v-if="index < items.length - 1" class="ui-crumbs__sep" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.ui-crumbs__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  font-size: 14px;
  line-height: 20px;
}

.ui-crumbs__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ui-crumbs__link {
  color: var(--link);
}

.ui-crumbs__current {
  color: var(--text2);
}

.ui-crumbs__sep {
  color: var(--text3);
}
</style>
