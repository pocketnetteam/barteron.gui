<script setup lang="ts">
import type { IconName } from './icons'
import UiIcon from './UiIcon.vue'

/**
 * - filter chip: a toggle (`selected` true/false), contrast when on;
 * - active filter: `removable`, soft violet with a remove button.
 */
withDefaults(
  defineProps<{
    selected?: boolean
    removable?: boolean
    /** Accessible name of the remove button, e.g. «Убрать фильтр цены». */
    removeLabel?: string
    icon?: IconName
    /** 36 — desktop, 32 — phone rows. */
    size?: 32 | 36
  }>(),
  { selected: undefined, size: 36 }
)

defineEmits<{ remove: [] }>()
</script>

<template>
  <span v-if="removable" class="ui-chip ui-chip--active" :class="`ui-chip--h${size}`">
    <UiIcon v-if="icon" :name="icon" :size="16" />
    <slot />
    <button
      type="button"
      class="ui-chip__remove"
      :aria-label="removeLabel"
      @click="$emit('remove')"
    >
      <UiIcon name="close" :size="14" :stroke="2.4" />
    </button>
  </span>
  <button
    v-else
    type="button"
    class="ui-chip"
    :class="[`ui-chip--h${size}`, { 'ui-chip--selected': selected }]"
    :aria-pressed="selected"
  >
    <UiIcon v-if="icon" :name="icon" :size="16" />
    <slot />
  </button>
</template>

<style scoped>
.ui-chip {
  flex: none;
  box-sizing: border-box;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--muted);
  color: var(--text);
  font: 500 14px / 20px var(--font-sans);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: background-color var(--duration);
}

button.ui-chip:hover {
  background: var(--muted-hover);
}

.ui-chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}

.ui-chip--h32 {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.ui-chip--selected,
button.ui-chip--selected:hover {
  background: var(--contrast);
  color: var(--on-contrast);
  font-weight: 600;
}

.ui-chip--active {
  padding: 0 6px 0 14px;
  gap: 4px;
  background: var(--primary-soft);
  color: var(--link);
  font-weight: 600;
}

.ui-chip--active.ui-chip--h32 {
  padding: 0 4px 0 12px;
}

.ui-chip__remove {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ui-chip__remove:hover {
  background: var(--primary-soft-hover);
}

.ui-chip__remove:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
</style>
