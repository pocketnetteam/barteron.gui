<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { IconName } from '@/ui/icons'
import UiIcon from '@/ui/UiIcon.vue'

export type TabKey = 'search' | 'favorites' | 'create' | 'exchanges' | 'profile'

export interface TabItem {
  key: TabKey
  to?: RouteLocationRaw
  /** A dot: something new in this section. */
  dot?: boolean
}

/**
 * Phone navigation (< 768 px): Поиск · Избранное · Разместить · Обмены ·
 * Профиль. Chats stay in Bastyon itself, so there is no chat tab.
 */
defineProps<{ items: TabItem[]; active?: TabKey }>()
const emit = defineEmits<{ select: [key: TabKey] }>()
const { t } = useI18n()

const ICONS: Record<TabKey, IconName> = {
  search: 'search',
  favorites: 'heart',
  create: 'plus',
  exchanges: 'exchange',
  profile: 'user',
}
</script>

<template>
  <nav class="tabbar" :aria-label="t('tabbar.label')">
    <component
      :is="item.to ? RouterLink : 'button'"
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      :type="item.to ? undefined : 'button'"
      class="tabbar__item"
      :class="{
        'tabbar__item--active': item.key === active,
        'tabbar__item--create': item.key === 'create',
      }"
      :aria-current="item.key === active ? 'page' : undefined"
      @click="emit('select', item.key)"
    >
      <span v-if="item.key === 'create'" class="tabbar__create">
        <UiIcon name="plus" :size="20" :stroke="2.2" />
      </span>
      <UiIcon v-else :name="ICONS[item.key]" :size="24" :stroke="item.key === active ? 2 : 1.8" />
      {{ t(`tabbar.${item.key}`) }}
      <span v-if="item.dot" class="tabbar__dot">
        <span class="visually-hidden">{{ t('tabbar.new') }}</span>
      </span>
    </component>
  </nav>
</template>

<style scoped>
.tabbar {
  box-sizing: content-box;
  height: var(--tabbar-h);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
}

.tabbar__item {
  position: relative;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text2);
  font: 400 11px / 14px var(--font-sans);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.tabbar__item:hover {
  text-decoration: none;
}

.tabbar__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--ring);
}

.tabbar__item--active {
  color: var(--link);
  font-weight: 600;
}

.tabbar__create {
  width: 40px;
  height: 28px;
  border-radius: 10px;
  background: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabbar__dot {
  position: absolute;
  top: 10px;
  left: calc(50% + 8px);
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--danger);
}
</style>
