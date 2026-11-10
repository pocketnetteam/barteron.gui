<script setup lang="ts">
import { useId } from 'vue'

/**
 * A short hint over its trigger, on hover and keyboard focus. The trigger gets
 * the hint id through the slot: `<UiTooltip v-slot="{ describedby }">`.
 */
withDefaults(defineProps<{ text: string; placement?: 'top' | 'bottom' }>(), {
  placement: 'top',
})

const id = `tip-${useId()}`
</script>

<template>
  <span class="ui-tooltip" :class="`ui-tooltip--${placement}`">
    <slot :describedby="id" />
    <span :id="id" class="ui-tooltip__bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<style scoped>
.ui-tooltip {
  position: relative;
  display: inline-flex;
}

.ui-tooltip__bubble {
  position: absolute;
  z-index: var(--z-popover);
  left: 0;
  bottom: calc(100% + 8px);
  width: max-content;
  max-width: 200px;
  padding: 8px 10px;
  border-radius: var(--radius-s);
  background: var(--contrast);
  color: var(--on-contrast);
  font-size: 12px;
  line-height: 16px;
  font-weight: 400;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--duration);
}

.ui-tooltip__bubble::after {
  content: '';
  position: absolute;
  left: 16px;
  bottom: -5px;
  width: 10px;
  height: 10px;
  background: var(--contrast);
  transform: rotate(45deg);
}

.ui-tooltip--bottom .ui-tooltip__bubble {
  bottom: auto;
  top: calc(100% + 8px);
}

.ui-tooltip--bottom .ui-tooltip__bubble::after {
  bottom: auto;
  top: -5px;
}

.ui-tooltip:hover .ui-tooltip__bubble,
.ui-tooltip:focus-within .ui-tooltip__bubble,
.ui-tooltip--open .ui-tooltip__bubble {
  opacity: 1;
  visibility: visible;
}
</style>
