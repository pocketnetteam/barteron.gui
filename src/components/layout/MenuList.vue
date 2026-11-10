<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/ui/UiIcon.vue'

export interface MenuItem {
  key: string
  label: string
  /** The current choice in a list of options. */
  checked?: boolean
  /** A count on the right: «12». */
  meta?: string | number | null
  /** Opens Bastyon: ↗ on the right. */
  external?: boolean
  to?: RouteLocationRaw
  /** A line above the item. */
  divider?: boolean
}

/** Rows of a header menu (s2-nav-desktop: currency, profile). */
defineProps<{ items: MenuItem[]; hint?: string }>()
const emit = defineEmits<{ select: [key: string] }>()
const { t } = useI18n()
</script>

<template>
  <div class="menu">
    <p v-if="hint" class="menu__hint">{{ hint }}</p>
    <template v-for="item in items" :key="item.key">
      <span v-if="item.divider" class="menu__divider" aria-hidden="true" />
      <component
        :is="item.to ? RouterLink : 'button'"
        :to="item.to"
        :type="item.to ? undefined : 'button'"
        class="menu__item"
        :class="{ 'menu__item--checked': item.checked }"
        :aria-pressed="item.checked === undefined || item.to ? undefined : item.checked"
        :data-key="item.key"
        @click="emit('select', item.key)"
      >
        <span class="menu__label">{{ item.label }}</span>
        <span v-if="item.meta !== undefined && item.meta !== null" class="menu__meta">{{
          item.meta
        }}</span>
        <UiIcon v-if="item.checked" name="check" :size="16" :stroke="2.4" />
        <template v-if="item.external">
          <UiIcon class="menu__ext" name="external" :size="14" :stroke="2" />
          <span class="visually-hidden">{{ t('ui.opensInBastyon') }}</span>
        </template>
      </component>
    </template>
  </div>
</template>

<style scoped>
.menu {
  padding: 8px;
  display: flex;
  flex-direction: column;
}

.menu__hint {
  margin: 0;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 16px;
  color: var(--text3);
}

.menu__divider {
  height: 1px;
  margin: 6px 12px;
  background: var(--border);
}

.menu__item {
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text);
  font: 400 14px / 20px var(--font-sans);
  text-align: left;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu__item:hover {
  background: var(--muted);
  text-decoration: none;
}

.menu__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--ring);
}

.menu__item--checked,
.menu__item--checked:hover {
  background: var(--primary-soft);
  color: var(--link);
  font-weight: 600;
}

.menu__label {
  flex: 1;
  min-width: 0;
}

.menu__meta {
  font-size: 13px;
  color: var(--text3);
  font-variant-numeric: tabular-nums;
}

.menu__ext {
  color: var(--text3);
}
</style>
